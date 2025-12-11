import { Request, Response } from 'express';
import Training from '../models/Training';

// Get all trainings with optional filtering
export const getTrainings = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;
    const { status, category, trainingType, priority } = req.query;

    const filter: any = { tenantId };

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (trainingType) filter.trainingType = trainingType;
    if (priority) filter.priority = priority;

    const trainings = await Training.find(filter)
      .populate('assignedTo', 'firstName lastName email')
      .populate('completedBy', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .sort({ scheduledDate: -1 });

    res.json({
      success: true,
      data: trainings,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching trainings',
    });
  }
};

// Get single training by ID
export const getTraining = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;
    const { id } = req.params;

    const training = await Training.findOne({ _id: id, tenantId })
      .populate('assignedTo', 'firstName lastName email')
      .populate('completedBy', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email');

    if (!training) {
      return res.status(404).json({
        success: false,
        message: 'Training not found',
      });
    }

    res.json({
      success: true,
      data: training,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching training',
    });
  }
};

// Create new training
export const createTraining = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;
    const userId = (req as any).user.id || (req as any).user.userId;

    console.log('Creating training with data:', JSON.stringify(req.body, null, 2));
    console.log('TenantId:', tenantId, 'UserId:', userId);

    // Auto-generate training number
    const currentYear = new Date().getFullYear();
    const lastTraining = await Training.findOne({ tenantId })
      .sort({ createdAt: -1 })
      .select('trainingNumber');

    let nextNumber = 1;
    if (lastTraining?.trainingNumber) {
      const match = lastTraining.trainingNumber.match(/TRN-\d{4}-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }
    const trainingNumber = `TRN-${currentYear}-${String(nextNumber).padStart(3, '0')}`;

    const trainingData = {
      ...req.body,
      trainingNumber,
      tenantId,
      createdBy: userId,
    };

    console.log('Final training data:', JSON.stringify(trainingData, null, 2));

    const training = new Training(trainingData);
    await training.save();

    const populatedTraining = await Training.findById(training._id)
      .populate('assignedTo', 'firstName lastName email')
      .populate('completedBy', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email');

    res.status(201).json({
      success: true,
      data: populatedTraining,
    });
  } catch (error: any) {
    console.error('Error creating training:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error creating training',
      errors: error.errors, // Include validation errors if any
    });
  }
};

// Update training
export const updateTraining = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;
    const { id } = req.params;

    const training = await Training.findOneAndUpdate(
      { _id: id, tenantId },
      req.body,
      { new: true, runValidators: true }
    )
      .populate('assignedTo', 'firstName lastName email')
      .populate('completedBy', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email');

    if (!training) {
      return res.status(404).json({
        success: false,
        message: 'Training not found',
      });
    }

    res.json({
      success: true,
      data: training,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Error updating training',
    });
  }
};

// Delete training
export const deleteTraining = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;
    const { id } = req.params;

    const training = await Training.findOneAndDelete({ _id: id, tenantId });

    if (!training) {
      return res.status(404).json({
        success: false,
        message: 'Training not found',
      });
    }

    res.json({
      success: true,
      message: 'Training deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting training',
    });
  }
};
