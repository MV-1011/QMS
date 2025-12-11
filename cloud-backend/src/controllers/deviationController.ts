import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';
import { Deviation } from '../models';
import { logger } from '../utils/logger';

export const getDeviations = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status, severity, category } = req.query;
    const tenantId = req.tenantId;

    if (!tenantId) {
      throw new ApiError(401, 'Tenant ID not found');
    }

    // Build query
    const query: any = { tenantId };

    if (status) {
      query.status = status;
    }

    if (severity) {
      query.severity = severity;
    }

    if (category) {
      query.category = category;
    }

    const deviations = await Deviation.find(query)
      .populate('detectedBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .sort({ occurrenceDate: -1 });

    res.json({
      success: true,
      data: deviations,
      count: deviations.length,
    });
  } catch (error) {
    next(error);
  }
};

export const getDeviation = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    const deviation = await Deviation.findOne({
      _id: id,
      tenantId,
    })
      .populate('detectedBy', 'firstName lastName email role')
      .populate('assignedTo', 'firstName lastName email role')
      .populate('verifiedBy', 'firstName lastName email role')
      .populate('createdBy', 'firstName lastName email role')
      .populate('updatedBy', 'firstName lastName email role');

    if (!deviation) {
      throw new ApiError(404, 'Deviation not found');
    }

    res.json({
      success: true,
      data: deviation,
    });
  } catch (error) {
    next(error);
  }
};

export const createDeviation = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const tenantId = req.tenantId;
    const userId = req.user?.id;

    if (!tenantId || !userId) {
      throw new ApiError(401, 'Unauthorized');
    }

    // Auto-generate deviation number
    const currentYear = new Date().getFullYear();
    const lastDev = await Deviation.findOne({ tenantId })
      .sort({ createdAt: -1 })
      .select('deviationNumber');

    let nextNumber = 1;
    if (lastDev?.deviationNumber) {
      const match = lastDev.deviationNumber.match(/DEV-\d{4}-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }
    const deviationNumber = `DEV-${currentYear}-${String(nextNumber).padStart(3, '0')}`;

    const deviationData = {
      ...req.body,
      deviationNumber,
      tenantId,
      detectedBy: userId,
      createdBy: userId,
      updatedBy: userId,
      status: 'open',
    };

    const deviation = await Deviation.create(deviationData);

    logger.info(`Deviation created: ${deviation.deviationNumber} by user ${userId}`);

    res.status(201).json({
      success: true,
      data: deviation,
      message: 'Deviation created successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const updateDeviation = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;
    const userId = req.user?.id;

    if (!tenantId || !userId) {
      throw new ApiError(401, 'Unauthorized');
    }

    const deviation = await Deviation.findOne({
      _id: id,
      tenantId,
    });

    if (!deviation) {
      throw new ApiError(404, 'Deviation not found');
    }

    // Update fields
    Object.assign(deviation, req.body);
    deviation.updatedBy = userId as any;

    await deviation.save();

    logger.info(`Deviation updated: ${deviation.deviationNumber} by user ${userId}`);

    res.json({
      success: true,
      data: deviation,
      message: 'Deviation updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteDeviation = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;
    const userId = req.user?.id;

    const deviation = await Deviation.findOneAndDelete({
      _id: id,
      tenantId,
    });

    if (!deviation) {
      throw new ApiError(404, 'Deviation not found');
    }

    logger.info(`Deviation deleted: ${deviation.deviationNumber} by user ${userId}`);

    res.json({
      success: true,
      message: 'Deviation deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
