import { Request, Response, NextFunction } from 'express';

export const catchAsync = <T extends Request>(fn: (req: T, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: T, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      // Ensure we have a proper Error object
      const err = error instanceof Error ? error : new Error(String(error));
      next(err);
    });
  };
};
