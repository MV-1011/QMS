import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';
import { ChangeControl } from '../models';
import { logger } from '../utils/logger';

export const getChangeControls = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status, priority, changeType } = req.query;
    const tenantId = req.tenantId;

    if (!tenantId) {
      throw new ApiError(401, 'Tenant ID not found');
    }

    // Build query
    const query: any = { tenantId };

    if (status) {
      query.status = status;
    }

    if (priority) {
      query.priority = priority;
    }

    if (changeType) {
      query.changeType = changeType;
    }

    const changeControls = await ChangeControl.find(query)
      .populate('requestorId', 'firstName lastName email')
      .populate('approverId', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: changeControls,
      count: changeControls.length,
    });
  } catch (error) {
    next(error);
  }
};

export const getChangeControl = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    const changeControl = await ChangeControl.findOne({
      _id: id,
      tenantId,
    })
      .populate('requestorId', 'firstName lastName email role')
      .populate('approverId', 'firstName lastName email role')
      .populate('createdBy', 'firstName lastName email role')
      .populate('updatedBy', 'firstName lastName email role');

    if (!changeControl) {
      throw new ApiError(404, 'Change control not found');
    }

    res.json({
      success: true,
      data: changeControl,
    });
  } catch (error) {
    next(error);
  }
};

export const createChangeControl = async (
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

    // Auto-generate change number
    const currentYear = new Date().getFullYear();
    const lastCC = await ChangeControl.findOne({ tenantId })
      .sort({ createdAt: -1 })
      .select('changeNumber');

    let nextNumber = 1;
    if (lastCC?.changeNumber) {
      const match = lastCC.changeNumber.match(/CC-\d{4}-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }
    const changeNumber = `CC-${currentYear}-${String(nextNumber).padStart(3, '0')}`;

    const changeControlData = {
      ...req.body,
      changeNumber,
      tenantId,
      requestorId: userId,
      createdBy: userId,
      updatedBy: userId,
      status: 'initiated',
    };

    const changeControl = await ChangeControl.create(changeControlData);

    logger.info(`Change control created: ${changeControl.changeNumber} by user ${userId}`);

    res.status(201).json({
      success: true,
      data: changeControl,
      message: 'Change control created successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const updateChangeControl = async (
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

    const changeControl = await ChangeControl.findOne({
      _id: id,
      tenantId,
    });

    if (!changeControl) {
      throw new ApiError(404, 'Change control not found');
    }

    // Update fields
    Object.assign(changeControl, req.body);
    changeControl.updatedBy = userId as any;

    await changeControl.save();

    logger.info(`Change control updated: ${changeControl.changeNumber} by user ${userId}`);

    res.json({
      success: true,
      data: changeControl,
      message: 'Change control updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteChangeControl = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;
    const userId = req.user?.id;

    const changeControl = await ChangeControl.findOneAndDelete({
      _id: id,
      tenantId,
    });

    if (!changeControl) {
      throw new ApiError(404, 'Change control not found');
    }

    logger.info(`Change control deleted: ${changeControl.changeNumber} by user ${userId}`);

    res.json({
      success: true,
      message: 'Change control deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
