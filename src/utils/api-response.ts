import { Response } from 'express';
import * as zod from 'zod';

export interface ApiErrorDetails {
  code: string;
  message: string;
  details?: any;
}

export class ApiResponse {
  private static send(res: Response, statusCode: number, success: boolean, data?: any, error?: ApiErrorDetails): void {
    const response = {
      success,
      ...(data && { data }),
      ...(error && { error }),
    };
    res.status(statusCode).json(response);
  }

  static success<T>(res: Response, data: T, statusCode = 200): void {
    return this.send(res, statusCode, true, data);
  }

  static created<T>(res: Response, data: T): void {
    return this.send(res, 201, true, data);
  }

  static error(res: Response, error: ApiErrorDetails, statusCode = 500): void {
    return this.send(res, statusCode, false, undefined, error);
  }

  static badRequest(res: Response, message: string, details?: Record<string, unknown>): void {
    return this.error(
      res,
      {
        code: 'BAD_REQUEST',
        message,
        details,
      },
      400,
    );
  }

  static unauthorized(res: Response, message = 'Unauthorized'): void {
    return this.error(
      res,
      {
        code: 'UNAUTHORIZED',
        message,
      },
      401,
    );
  }

  static forbidden(res: Response, message = 'Forbidden'): void {
    return this.error(
      res,
      {
        code: 'FORBIDDEN',
        message,
      },
      403,
    );
  }

  static notFound(res: Response, message = 'Resource not found'): void {
    return this.error(
      res,
      {
        code: 'NOT_FOUND',
        message,
      },
      404,
    );
  }

  static validationError(res: Response, details: Array<zod.ZodIssue>): void {
    return this.error(
      res,
      {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details,
      },
      400,
    );
  }

  static serverError(res: Response, message = 'Internal server error'): void {
    return this.error(
      res,
      {
        code: 'INTERNAL_SERVER_ERROR',
        message,
      },
      500,
    );
  }

  static conflict(res: Response, message = 'Conflict'): void {
    return this.error(
      res,
      {
        code: 'CONFLICT',
        message,
      },
      409,
    );
  }

  static tooManyRequests(res: Response, message = 'Too Many Requests'): void {
    return this.error(
      res,
      {
        code: 'TOO_MANY_REQUESTS',
        message,
      },
      429,
    );
  }
}
