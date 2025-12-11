import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';
import { CAPA } from '../models';
import { logger } from '../utils/logger';

export const getCAPAs = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status, priority, type, source } = req.query;
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

    if (type) {
      query.type = type;
    }

    if (source) {
      query.source = source;
    }

    const capas = await CAPA.find(query)
      .populate('assignedTo', 'firstName lastName email')
      .populate('verifiedBy', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: capas,
      count: capas.length,
    });
  } catch (error) {
    next(error);
  }
};

export const getCAPA = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    const capa = await CAPA.findOne({
      _id: id,
      tenantId,
    })
      .populate('assignedTo', 'firstName lastName email role')
      .populate('verifiedBy', 'firstName lastName email role')
      .populate('createdBy', 'firstName lastName email role')
      .populate('updatedBy', 'firstName lastName email role');

    if (!capa) {
      throw new ApiError(404, 'CAPA not found');
    }

    res.json({
      success: true,
      data: capa,
    });
  } catch (error) {
    next(error);
  }
};

export const createCAPA = async (
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

    // Auto-generate CAPA number
    const currentYear = new Date().getFullYear();
    const lastCapa = await CAPA.findOne({ tenantId })
      .sort({ createdAt: -1 })
      .select('capaNumber');

    let nextNumber = 1;
    if (lastCapa?.capaNumber) {
      const match = lastCapa.capaNumber.match(/CAPA-\d{4}-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }
    const capaNumber = `CAPA-${currentYear}-${String(nextNumber).padStart(3, '0')}`;

    const capaData = {
      ...req.body,
      capaNumber,
      tenantId,
      createdBy: userId,
      updatedBy: userId,
      status: 'open',
    };

    const capa = await CAPA.create(capaData);

    logger.info(`CAPA created: ${capa.capaNumber} by user ${userId}`);

    res.status(201).json({
      success: true,
      data: capa,
      message: 'CAPA created successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const updateCAPA = async (
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

    const capa = await CAPA.findOne({
      _id: id,
      tenantId,
    });

    if (!capa) {
      throw new ApiError(404, 'CAPA not found');
    }

    // Update fields
    Object.assign(capa, req.body);
    capa.updatedBy = userId as any;

    await capa.save();

    logger.info(`CAPA updated: ${capa.capaNumber} by user ${userId}`);

    res.json({
      success: true,
      data: capa,
      message: 'CAPA updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCAPA = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;
    const userId = req.user?.id;

    const capa = await CAPA.findOneAndDelete({
      _id: id,
      tenantId,
    });

    if (!capa) {
      throw new ApiError(404, 'CAPA not found');
    }

    logger.info(`CAPA deleted: ${capa.capaNumber} by user ${userId}`);

    res.json({
      success: true,
      message: 'CAPA deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
