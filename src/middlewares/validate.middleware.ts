import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ApiResponse } from '../utils/api-response';
import logger from '../utils/logger';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      validated: {
        params?: unknown;
        query?: unknown;
        body?: unknown;
      };
    }
  }
}

export const validateRequest = <TParams = unknown, TQuery = unknown, TBody = unknown>(schemas: {
  params?: z.ZodType<TParams>;
  query?: z.ZodType<TQuery>;
  body?: z.ZodType<TBody>;
}) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.validated = {};

      if (schemas.params) {
        req.validated.params = await schemas.params.parseAsync(req.params);
      }

      if (schemas.query) {
        req.validated.query = await schemas.query.parseAsync(req.query);
      }

      if (schemas.body) {
        req.validated.body = await schemas.body.parseAsync(req.body);
      }

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.debug('Validation Error:', {
          errors: error.errors,
          path: req.path,
          method: req.method,
        });

        ApiResponse.validationError(res, error.errors);
        return;
      }
      next(error);
    }
  };
};
