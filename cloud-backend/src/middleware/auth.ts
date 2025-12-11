import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from './errorHandler';
import { User, IUserPermissions } from '../models/User';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    tenantId: string;
    role: string;
    permissions?: IUserPermissions;
  };
  tenantId?: string;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'No token provided');
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET!;

    const decoded = jwt.verify(token, secret) as {
      id: string;
      email: string;
      tenantId: string;
      role: string;
    };

    req.user = decoded;
    req.tenantId = decoded.tenantId;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new ApiError(401, 'Invalid token'));
    } else {
      next(error);
    }
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, 'Unauthorized'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(403, 'You do not have permission to perform this action')
      );
    }

    next();
  };
};

// Tenant isolation middleware
export const tenantIsolation = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || !req.user.tenantId) {
    return next(new ApiError(401, 'Unauthorized'));
  }

  const tenantIdFromHeader = req.headers['x-tenant-id'] as string;

  // If header is provided, verify it matches the JWT tenant ID
  // Convert both to strings for comparison to handle ObjectId differences
  if (tenantIdFromHeader && String(tenantIdFromHeader) !== String(req.user.tenantId)) {
    return next(new ApiError(403, 'Tenant mismatch'));
  }

  // Ensure tenantId is set on request for controllers to use
  req.tenantId = req.user.tenantId;

  next();
};

// Permission-based authorization middleware
export const requirePermission = (permission: keyof IUserPermissions) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new ApiError(401, 'Unauthorized'));
      }

      // Fetch user with permissions from database
      const user = await User.findById(req.user.id);
      if (!user) {
        return next(new ApiError(401, 'User not found'));
      }

      // Admin always has access
      if (user.role === 'admin') {
        req.user.permissions = user.permissions;
        return next();
      }

      // Check specific permission
      if (!user.permissions || !user.permissions[permission]) {
        return next(new ApiError(403, `You do not have permission: ${permission}`));
      }

      req.user.permissions = user.permissions;
      next();
    } catch (error) {
      next(error);
    }
  };
};
