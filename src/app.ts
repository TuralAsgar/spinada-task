import express, { NextFunction, Request, RequestHandler, Response } from 'express';
import sequelize from './config/database';
import { config, isProduction, isTest } from './config/environment';
import authRoutes from './routes/auth/auth.routes';
import userRoutes from './routes/user/user.routes';
import dataRoutes from './routes/data/data.routes';
import { ValidationError } from 'zod-validation-error';
import logger from './utils/logger';
import { ApiResponse } from './utils/api-response';
import { rateLimiters, speedLimiters } from './middlewares/rate-limiter';
import { join } from 'path';
import swaggerUi from 'swagger-ui-express';
import { readFileSync } from 'fs';
import yaml from 'yaml';

class App {
  public app: express.Application;
  private shutdownInProgress = false;
  private connectionTracker = new Set<any>(); // Track active connections
  private readonly SHUTDOWN_TIMEOUT = 30000; // 30 seconds timeout

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    if (!isTest) {
      void this.connectToDatabase();
      this.setupShutdownHandlers();
    }
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  public async connectToDatabase(): Promise<void> {
    try {
      await sequelize.sync();
      logger.info('Database connected successfully');
    } catch (error) {
      logger.error('Unable to connect to the database:', error);
    }
  }

  private initializeMiddlewares(): void {
    // Basic middleware
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Apply default rate limiters and speed limiters globally
    this.app.use(speedLimiters.default);
    this.app.use(rateLimiters.default);
  }

  private initializeRoutes(): void {
    // Apply specific rate and speed limits for auth routes
    this.app.use('/v1/auth', speedLimiters.auth, rateLimiters.auth, authRoutes);

    // Apply API rate and speed limits for user and data routes
    this.app.use('/v1/users', speedLimiters.api, rateLimiters.api, userRoutes);
    this.app.use('/v1/data', speedLimiters.api, rateLimiters.api, dataRoutes);

    // Set up Swagger UI
    this.app.use('/v1/api/docs', swaggerUi.serve, this.setupSwaggerUI());

    // Handle 404 - must be after all routes
    this.app.use((req: Request, res: Response) => {
      ApiResponse.notFound(res, `Route ${req.path} not found`);
    });
  }

  private setupSwaggerUI(): RequestHandler {
    const openApiPath = join(process.cwd(), 'openapi.yaml');
    const openApiDocument = yaml.parse(readFileSync(openApiPath, 'utf8'));
    return swaggerUi.setup(openApiDocument);
  }

  private initializeErrorHandling(): void {
    // Global error handler - must be last middleware
    this.app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
      logger.error('Unhandled error:', {
        name: err.name,
        message: err.message,
        path: req.path,
        method: req.method,
        body: req.body,
        query: req.query,
        stack: isProduction ? err.stack : undefined,
      });

      // Handle validation errors
      if (err instanceof ValidationError) {
        return ApiResponse.validationError(res, err.details);
      }

      // Map service errors to appropriate HTTP responses
      if (err.message.includes('Rate limit exceeded')) {
        return ApiResponse.tooManyRequests(res, err.message);
      }
      if (err.message.includes('Invalid API key')) {
        return ApiResponse.unauthorized(res, err.message);
      }
      if (err.message.includes('Invalid response format')) {
        return ApiResponse.badRequest(res, err.message);
      }

      // Default error response
      return ApiResponse.error(res, {
        code: err.name || 'INTERNAL_SERVER_ERROR',
        message: err.message || 'An unexpected error occurred',
        details: isProduction ? undefined : { stack: err.stack },
      });
    });
  }

  /**
   * Setup shutdown handlers on application start
   */
  private setupShutdownHandlers(): void {
    // Track connections
    this.server?.on('connection', (conn) => {
      this.connectionTracker.add(conn);
      conn.on('close', () => {
        this.connectionTracker.delete(conn);
      });
    });

    // Register process termination signal handlers
    ['SIGTERM', 'SIGINT', 'SIGUSR2'].forEach((signal) => {
      process.on(signal, () => {
        logger.info(`Received ${signal}.`);
        this.gracefulShutdown();
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
      this.gracefulShutdown();
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
      logger.error('Unhandled Rejection:', {
        reason: reason instanceof Error ? reason.message : reason,
        promise: promise,
      });
      this.gracefulShutdown();
    });
  }

  /**
   * Performs a graceful shutdown of the application,
   * ensuring all resources are properly released
   */
  public async gracefulShutdown(): Promise<void> {
    // Prevent multiple shutdown attempts
    if (this.shutdownInProgress) {
      logger.info('Shutdown already in progress...');
      return;
    }

    this.shutdownInProgress = true;
    logger.info('Starting graceful shutdown...');

    // Force shutdown after timeout to prevent hanging
    const forceShutdownTimeout = globalThis.setTimeout(() => {
      logger.error(`Could not close all connections in time (${this.SHUTDOWN_TIMEOUT}ms). Forcing exit.`);
      process.exit(1);
    }, this.SHUTDOWN_TIMEOUT);

    // Clear timeout if we exit properly
    forceShutdownTimeout.unref();

    try {
      // Stop accepting new connections but keep existing ones
      if (this.server) {
        logger.info('Stopping server from accepting new connections...');
        this.server.close(() => {
          logger.info('HTTP server closed successfully.');
        });

        // Close any keep-alive connections
        if (this.connectionTracker.size > 0) {
          logger.info(`Closing ${this.connectionTracker.size} open connections...`);
          for (const conn of this.connectionTracker) {
            conn.destroy();
          }
        }
      }

      // Give active requests a moment to complete
      logger.info('Waiting for active requests to complete...');
      await new Promise((resolve) => globalThis.setTimeout(resolve, 1000));

      // Close database connection
      if (sequelize) {
        logger.info('Closing database connections...');
        await sequelize.close();
        logger.info('Database connections closed.');
      }

      // Clear force shutdown timeout
      globalThis.clearTimeout(forceShutdownTimeout);

      logger.info('Graceful shutdown completed successfully.');
      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  }

  public listen(): void {
    this.server = this.app.listen(config.PORT, () => {
      logger.info(`Server running on port ${config.PORT}`);
    });
  }

  private server?: ReturnType<typeof this.app.listen>;
}

const app = new App();

if (!isTest) {
  app.listen();
}

export default app;
