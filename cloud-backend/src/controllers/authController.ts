import { Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { AuthRequest } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';
import { User, Tenant } from '../models';
import { logger } from '../utils/logger';

export const login = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError(400, 'Email and password are required');
    }

    // Find user (don't populate tenantId to keep it as ObjectId)
    const user = await User.findOne({ email, isActive: true });

    if (!user) {
      throw new ApiError(401, 'Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new ApiError(401, 'Invalid credentials');
    }

    // Extract tenantId as string - handle both ObjectId and populated object cases
    const tenantIdString = typeof user.tenantId === 'object' && user.tenantId !== null
      ? String((user.tenantId as any)._id || user.tenantId)
      : String(user.tenantId);

    // Generate JWT token
    const token = jwt.sign(
      {
        id: String(user._id),
        email: user.email,
        tenantId: tenantIdString,
        role: user.role,
      },
      process.env.JWT_SECRET || 'your_jwt_secret_key'
    );

    // Fetch tenant info for branding
    const tenant = await Tenant.findById(tenantIdString);

    // Log login
    logger.info(`User logged in: ${email} (Tenant: ${tenantIdString})`);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.json({
      success: true,
      token,
      tenantId: tenantIdString,
      user: {
        id: String(user._id),
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role,
      },
      tenant: tenant ? {
        name: tenant.name,
        subdomain: tenant.subdomain,
        branding: tenant.settings?.branding || {},
      } : null,
    });
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Unauthorized');
    }

    const user = await User.findById(req.user.id).select('email firstName lastName role');

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    res.json({
      success: true,
      id: user._id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      role: user.role,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info(`User logged out: ${req.user?.email}`);

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};
