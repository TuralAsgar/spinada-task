import { NextFunction, Request, RequestHandler, Response } from 'express';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { isProduction } from '../config/environment';
import logger from '../utils/logger';
import { ApiResponse } from '../utils/api-response';

const windowMs = 15 * 60 * 1000; // 15 minutes
/**
 * No-op middleware that just passes through requests
 * Used for development and test environments
 */
const noopMiddleware: RequestHandler = (req, res, next): void => next();

/**
 * Factory function for creating environment-aware rate limiters
 * @param options Rate limiter options
 * @returns Either the configured rate limiter or a pass-through middleware
 */
const createRateLimiter = (options: any): RequestHandler => {
  if (!isProduction) {
    return noopMiddleware;
  }

  return rateLimit(options);
};

/**
 * Factory function for creating environment-aware speed limiters
 * @param options Speed limiter options
 * @returns Either the configured speed limiter or a pass-through middleware
 */
const createSpeedLimiter = (options: any): RequestHandler => {
  if (!isProduction) {
    return noopMiddleware;
  }

  return slowDown(options);
};

/**
 * Rate limiter configuration for different route types
 */
export const rateLimiters = {
  // Default rate limiter - more permissive
  default: createRateLimiter({
    windowMs,
    max: 100, // limit each IP to 100 requests per 15 minutes
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: 'Too many requests, please try again later',
    handler: (req: Request, res: Response, _next: NextFunction, options: any): void => {
      logger.warn({
        message: 'Rate limit exceeded',
        ip: req.ip,
        path: req.path,
        environment: process.env.NODE_ENV,
      });

      return ApiResponse.tooManyRequests(res, options.message);
    },
  }),

  // Auth rate limiter - more restrictive
  auth: createRateLimiter({
    windowMs,
    max: 5, // limit each IP to 5 requests per 15 minutes
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many authentication attempts, please try again later',
    handler: (req: Request, res: Response, _next: NextFunction, options: any): void => {
      logger.warn({
        message: 'Auth rate limit exceeded',
        ip: req.ip,
        path: req.path,
        environment: process.env.NODE_ENV,
      });

      return ApiResponse.tooManyRequests(res, options.message);
    },
  }),

  // API rate limiter - medium restriction
  api: createRateLimiter({
    windowMs,
    max: 50, // limit each IP to 50 requests per 15 minutes
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many API requests, please try again later',
  }),
};

/**
 * Speed limiters to gradually slow down responses after certain thresholds
 */
export const speedLimiters = {
  // Default speed limiter
  default: createSpeedLimiter({
    windowMs,
    delayAfter: 50, // slow down after 50 requests
    delayMs: (hits: number) => hits * 100, // add 100ms per hit over threshold
  }),

  // Auth speed limiter - starts slowing down earlier
  auth: createSpeedLimiter({
    windowMs,
    delayAfter: 3, // slow down after 3 requests
    delayMs: (hits: number) => hits * 500, // add 500ms per hit over threshold
  }),

  // API speed limiter - medium restriction
  api: createSpeedLimiter({
    windowMs,
    delayAfter: 25, // slow down after 25 requests
    delayMs: (hits: number) => hits * 200, // add 200ms per hit over threshold
  }),
};
