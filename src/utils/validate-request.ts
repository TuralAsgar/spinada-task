import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';
import logger from './logger';
import { ApiResponse } from './api-response';

export const validateRequest = <TParams = unknown, TQuery = unknown, TBody = unknown>(schemas: {
  params?: z.ZodType<TParams>;
  query?: z.ZodType<TQuery>;
  body?: z.ZodType<TBody>;
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate params if schema exists
      if (schemas.params) {
        schemas.params.parse(req.params);
      }

      // Validate query if schema exists
      if (schemas.query) {
        schemas.query.parse(req.query);
      }

      // Validate body if schema exists
      if (schemas.body) {
        schemas.body.parse(req.body);
      }

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);

        logger.error('Validation Error:', validationError);

        ApiResponse.validationError(res, validationError.details);
      } else {
        next(error);
      }
    }
  };
};
