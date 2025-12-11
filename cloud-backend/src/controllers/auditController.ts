import { Request, Response } from 'express';
import Audit from '../models/Audit';

// Get all audits with optional filtering
export const getAudits = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;
    const { status, auditType, priority } = req.query;

    const filter: any = { tenantId };

    if (status) filter.status = status;
    if (auditType) filter.auditType = auditType;
    if (priority) filter.priority = priority;

    const audits = await Audit.find(filter)
      .populate('leadAuditor', 'firstName lastName email')
      .populate('auditTeam', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .sort({ scheduledDate: -1 });

    res.json({
      success: true,
      data: audits,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching audits',
    });
  }
};

// Get single audit by ID
export const getAudit = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;
    const { id } = req.params;

    const audit = await Audit.findOne({ _id: id, tenantId })
      .populate('leadAuditor', 'firstName lastName email')
      .populate('auditTeam', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email');

    if (!audit) {
      return res.status(404).json({
        success: false,
        message: 'Audit not found',
      });
    }

    res.json({
      success: true,
      data: audit,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching audit',
    });
  }
};

// Create new audit
export const createAudit = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;
    const userId = (req as any).user.id || (req as any).user.userId;

    // Auto-generate audit number (global unique, not per-tenant)
    const currentYear = new Date().getFullYear();
    // Find all audits and get the highest number
    const allAudits = await Audit.find({})
      .select('auditNumber')
      .lean();

    let maxNumber = 0;
    for (const a of allAudits) {
      if (a.auditNumber) {
        const match = a.auditNumber.match(/AUD-\d{4}-(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNumber) maxNumber = num;
        }
      }
    }
    const auditNumber = `AUD-${currentYear}-${String(maxNumber + 1).padStart(3, '0')}`;

    const auditData = {
      ...req.body,
      auditNumber,
      tenantId,
      createdBy: userId,
    };

    const audit = new Audit(auditData);
    await audit.save();

    const populatedAudit = await Audit.findById(audit._id)
      .populate('leadAuditor', 'firstName lastName email')
      .populate('auditTeam', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email');

    res.status(201).json({
      success: true,
      data: populatedAudit,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Error creating audit',
    });
  }
};

// Update audit
export const updateAudit = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;
    const { id } = req.params;

    const audit = await Audit.findOneAndUpdate(
      { _id: id, tenantId },
      req.body,
      { new: true, runValidators: true }
    )
      .populate('leadAuditor', 'firstName lastName email')
      .populate('auditTeam', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email');

    if (!audit) {
      return res.status(404).json({
        success: false,
        message: 'Audit not found',
      });
    }

    res.json({
      success: true,
      data: audit,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Error updating audit',
    });
  }
};

// Delete audit
export const deleteAudit = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;
    const { id } = req.params;

    const audit = await Audit.findOneAndDelete({ _id: id, tenantId });

    if (!audit) {
      return res.status(404).json({
        success: false,
        message: 'Audit not found',
      });
    }

    res.json({
      success: true,
      message: 'Audit deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting audit',
    });
  }
};
