import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/environment';
import User, { UserRole } from '../models/user.model';
import { ApiResponse } from '../utils/api-response';

// Extend the Request interface to include user property
declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string;
      email: string;
      role: UserRole;
    };
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Get token from Authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return ApiResponse.unauthorized(res, 'No token provided');
  }

  // Extract token (expecting "Bearer <token>")
  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return ApiResponse.unauthorized(res, 'Token error');
  }

  const token = parts[1];

  try {
    // Verify token
    const decoded = jwt.verify(token, config.JWT_SECRET) as {
      id: string;
      email: string;
      role: UserRole;
    };

    // Check if user still exists
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return ApiResponse.unauthorized(res, 'User not found');
    }

    // Attach user to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return ApiResponse.unauthorized(res, 'Token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return ApiResponse.unauthorized(res, 'Invalid token');
    }
    return ApiResponse.serverError(res);
  }
};

// Middleware to check admin role
export const adminMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // This assumes authMiddleware has already run and added user to request
  if (!req.user) {
    return ApiResponse.unauthorized(res, 'Unauthorized');
  }

  if (req.user.role !== UserRole.ADMIN) {
    return ApiResponse.forbidden(res, 'Access denied. Admin rights required.');
  }

  next();
};
