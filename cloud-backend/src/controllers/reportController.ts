import { Request, Response } from 'express';
import { Document, ChangeControl, Deviation, CAPA } from '../models';
import Audit from '../models/Audit';
import Training from '../models/Training';

// Get dashboard summary statistics
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;

    // Get counts for all modules
    const [
      documentsCount,
      changeControlsCount,
      deviationsCount,
      capasCount,
      auditsCount,
      trainingsCount,
    ] = await Promise.all([
      Document.countDocuments({ tenantId }),
      ChangeControl.countDocuments({ tenantId }),
      Deviation.countDocuments({ tenantId }),
      CAPA.countDocuments({ tenantId }),
      Audit.countDocuments({ tenantId }),
      Training.countDocuments({ tenantId }),
    ]);

    // Get status breakdowns
    const [
      documentsByStatus,
      changeControlsByStatus,
      deviationsByStatus,
      capasByStatus,
      auditsByStatus,
      trainingsByStatus,
    ] = await Promise.all([
      Document.aggregate([
        { $match: { tenantId: { $eq: tenantId } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      ChangeControl.aggregate([
        { $match: { tenantId: { $eq: tenantId } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Deviation.aggregate([
        { $match: { tenantId: { $eq: tenantId } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      CAPA.aggregate([
        { $match: { tenantId: { $eq: tenantId } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Audit.aggregate([
        { $match: { tenantId: { $eq: tenantId } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Training.aggregate([
        { $match: { tenantId: { $eq: tenantId } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    // Get open/pending items that need attention
    const [
      openDeviations,
      openCAPAs,
      overdueTrainings,
      upcomingAudits,
    ] = await Promise.all([
      Deviation.countDocuments({
        tenantId,
        status: { $in: ['open', 'investigation', 'pending_review'] },
      }),
      CAPA.countDocuments({
        tenantId,
        status: { $in: ['open', 'in_progress', 'pending_verification'] },
      }),
      Training.countDocuments({
        tenantId,
        status: 'overdue',
      }),
      Audit.countDocuments({
        tenantId,
        status: 'planned',
        scheduledDate: {
          $gte: new Date(),
          $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Next 30 days
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totals: {
          documents: documentsCount,
          changeControls: changeControlsCount,
          deviations: deviationsCount,
          capas: capasCount,
          audits: auditsCount,
          trainings: trainingsCount,
        },
        byStatus: {
          documents: documentsByStatus,
          changeControls: changeControlsByStatus,
          deviations: deviationsByStatus,
          capas: capasByStatus,
          audits: auditsByStatus,
          trainings: trainingsByStatus,
        },
        alerts: {
          openDeviations,
          openCAPAs,
          overdueTrainings,
          upcomingAudits,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching dashboard stats',
    });
  }
};

// Get detailed reports by module
export const getModuleReport = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;
    const { module } = req.params;
    const { startDate, endDate, status, groupBy } = req.query;

    const dateFilter: any = {};
    if (startDate) dateFilter.$gte = new Date(startDate as string);
    if (endDate) dateFilter.$lte = new Date(endDate as string);

    let Model: any;
    let dateField = 'createdAt';

    switch (module) {
      case 'documents':
        Model = Document;
        break;
      case 'change-controls':
        Model = ChangeControl;
        break;
      case 'deviations':
        Model = Deviation;
        dateField = 'reportedDate';
        break;
      case 'capas':
        Model = CAPA;
        break;
      case 'audits':
        Model = Audit;
        dateField = 'scheduledDate';
        break;
      case 'trainings':
        Model = Training;
        dateField = 'scheduledDate';
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid module specified',
        });
    }

    const matchFilter: any = { tenantId };
    if (Object.keys(dateFilter).length > 0) {
      matchFilter[dateField] = dateFilter;
    }
    if (status) matchFilter.status = status;

    // Get count by status
    const byStatus = await Model.aggregate([
      { $match: matchFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Get count by month (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const byMonth = await Model.aggregate([
      {
        $match: {
          tenantId,
          [dateField]: { $gte: twelveMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: `$${dateField}` },
            month: { $month: `$${dateField}` },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Get recent items
    const recentItems = await Model.find(matchFilter)
      .sort({ [dateField]: -1 })
      .limit(10)
      .select('-__v');

    res.json({
      success: true,
      data: {
        module,
        byStatus,
        byMonth,
        recentItems,
        totalCount: await Model.countDocuments(matchFilter),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error generating report',
    });
  }
};

// Get compliance summary
export const getComplianceSummary = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;

    // Calculate compliance metrics
    const [
      totalDeviations,
      closedDeviations,
      totalCAPAs,
      closedCAPAs,
      totalTrainings,
      completedTrainings,
      totalAudits,
      completedAudits,
    ] = await Promise.all([
      Deviation.countDocuments({ tenantId }),
      Deviation.countDocuments({ tenantId, status: 'closed' }),
      CAPA.countDocuments({ tenantId }),
      CAPA.countDocuments({ tenantId, status: 'closed' }),
      Training.countDocuments({ tenantId }),
      Training.countDocuments({ tenantId, status: 'completed' }),
      Audit.countDocuments({ tenantId }),
      Audit.countDocuments({ tenantId, status: { $in: ['completed', 'closed'] } }),
    ]);

    const deviationCloseRate = totalDeviations > 0 ? (closedDeviations / totalDeviations) * 100 : 100;
    const capaCloseRate = totalCAPAs > 0 ? (closedCAPAs / totalCAPAs) * 100 : 100;
    const trainingCompletionRate = totalTrainings > 0 ? (completedTrainings / totalTrainings) * 100 : 100;
    const auditCompletionRate = totalAudits > 0 ? (completedAudits / totalAudits) * 100 : 100;

    // Overall compliance score (weighted average)
    const overallScore = (
      deviationCloseRate * 0.25 +
      capaCloseRate * 0.25 +
      trainingCompletionRate * 0.25 +
      auditCompletionRate * 0.25
    );

    res.json({
      success: true,
      data: {
        overallScore: Math.round(overallScore),
        metrics: {
          deviations: {
            total: totalDeviations,
            closed: closedDeviations,
            rate: Math.round(deviationCloseRate),
          },
          capas: {
            total: totalCAPAs,
            closed: closedCAPAs,
            rate: Math.round(capaCloseRate),
          },
          trainings: {
            total: totalTrainings,
            completed: completedTrainings,
            rate: Math.round(trainingCompletionRate),
          },
          audits: {
            total: totalAudits,
            completed: completedAudits,
            rate: Math.round(auditCompletionRate),
          },
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching compliance summary',
    });
  }
};
