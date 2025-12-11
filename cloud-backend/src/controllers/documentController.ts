import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';
import { Document } from '../models';

export const getDocuments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const tenantId = req.tenantId;
    const { status, type, limit = 50, offset = 0 } = req.query;

    // Build query filter
    const filter: any = { tenantId };

    if (status) {
      filter.status = status;
    }

    if (type) {
      filter.documentType = type;
    }

    // Execute query
    const documents = await Document.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(Number(offset))
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    const count = await Document.countDocuments(filter);

    res.json({
      success: true,
      data: documents,
      count,
    });
  } catch (error) {
    next(error);
  }
};

export const getDocument = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    const document = await Document.findOne({ _id: id, tenantId })
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName email');

    if (!document) {
      throw new ApiError(404, 'Document not found');
    }

    res.json({
      success: true,
      data: document,
    });
  } catch (error) {
    next(error);
  }
};

export const createDocument = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      title,
      documentType,
      content,
      version,
      status = 'draft',
    } = req.body;

    const tenantId = req.tenantId;
    const userId = req.user?.id;

    if (!title || !documentType) {
      throw new ApiError(400, 'Title and document type are required');
    }

    const document = new Document({
      tenantId,
      title,
      documentType,
      content,
      version: version || '1.0',
      status,
      createdBy: userId,
      updatedBy: userId,
    });

    await document.save();

    res.status(201).json({
      success: true,
      data: document,
    });
  } catch (error) {
    next(error);
  }
};

export const updateDocument = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { title, content, version, status } = req.body;
    const tenantId = req.tenantId;
    const userId = req.user?.id;

    // Check if document exists and belongs to tenant
    const document = await Document.findOne({ _id: id, tenantId });

    if (!document) {
      throw new ApiError(404, 'Document not found');
    }

    // Update fields
    if (title !== undefined) {
      document.title = title;
    }

    if (content !== undefined) {
      document.content = content;
    }

    if (version !== undefined) {
      document.version = version;
    }

    if (status !== undefined) {
      document.status = status;
    }

    document.updatedBy = userId! as any;

    await document.save();

    res.json({
      success: true,
      data: document,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteDocument = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    const result = await Document.findOneAndDelete({ _id: id, tenantId });

    if (!result) {
      throw new ApiError(404, 'Document not found');
    }

    res.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
