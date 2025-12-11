import { Request, Response } from 'express';
import TrainingContent from '../models/TrainingContent';
import Training from '../models/Training';
import { getContentType } from '../middleware/upload';
import { convertPptToImages } from '../utils/pptConverter';
import { logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';

// Get all content for a training
export const getTrainingContent = async (req: Request, res: Response) => {
  try {
    const { trainingId } = req.params;
    const tenantId = (req as any).user.tenantId;

    const content = await TrainingContent.find({ trainingId, tenantId })
      .sort({ order: 1 })
      .populate('createdBy', 'firstName lastName');

    res.json({
      success: true,
      data: content,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching training content',
    });
  }
};

// Upload content file
export const uploadContentFile = async (req: Request, res: Response) => {
  try {
    const { trainingId } = req.params;
    const tenantId = (req as any).user.tenantId;
    const userId = (req as any).user.id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    // Verify training exists and belongs to tenant
    const training = await Training.findOne({ _id: trainingId, tenantId });
    if (!training) {
      // Delete uploaded file
      fs.unlinkSync(file.path);
      return res.status(404).json({
        success: false,
        message: 'Training not found',
      });
    }

    // Get existing content count for order
    const existingCount = await TrainingContent.countDocuments({ trainingId, tenantId });

    // Determine content type from mimetype
    const contentType = getContentType(file.mimetype);

    // Process PPT files - convert to slide images
    let slides: string[] | undefined;
    let slideCount: number | undefined;

    if (contentType === 'ppt') {
      logger.info(`Processing PPT file: ${file.originalname}`);

      // Create output directory for slides
      const slideDir = path.join(process.cwd(), 'uploads', 'content', 'slides', file.filename.replace(/\.[^/.]+$/, ''));

      const conversionResult = await convertPptToImages(file.path, slideDir);

      if (conversionResult.success && conversionResult.slideCount > 0) {
        // Convert absolute paths to relative URLs
        slides = conversionResult.slides.map(slidePath => {
          const relativePath = path.relative(process.cwd(), slidePath);
          return `/${relativePath.replace(/\\/g, '/')}`;
        });
        slideCount = conversionResult.slideCount;
        logger.info(`PPT converted to ${slideCount} slides`);
      } else {
        logger.warn(`PPT conversion failed or no slides: ${conversionResult.error}`);
        // Still continue - user can download the file
      }
    }

    // Create content record
    const content = await TrainingContent.create({
      tenantId,
      trainingId,
      title: req.body.title || file.originalname.replace(/\.[^/.]+$/, ''),
      description: req.body.description || '',
      contentType,
      contentUrl: `/uploads/content/${file.filename}`,
      slides,
      slideCount,
      fileName: file.originalname,
      fileSize: file.size,
      duration: req.body.duration ? parseInt(req.body.duration) : undefined,
      order: existingCount,
      isRequired: req.body.isRequired !== 'false',
      createdBy: userId,
    });

    res.status(201).json({
      success: true,
      data: content,
      message: contentType === 'ppt' && slides
        ? `Content uploaded and converted to ${slideCount} slides`
        : 'Content uploaded successfully',
    });
  } catch (error: any) {
    // Clean up file if there was an error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Error uploading content',
    });
  }
};

// Add content with URL (for external links)
export const addContentLink = async (req: Request, res: Response) => {
  try {
    const { trainingId } = req.params;
    const tenantId = (req as any).user.tenantId;
    const userId = (req as any).user.id;
    const { title, description, contentUrl, contentType, duration, isRequired } = req.body;

    // Verify training exists
    const training = await Training.findOne({ _id: trainingId, tenantId });
    if (!training) {
      return res.status(404).json({
        success: false,
        message: 'Training not found',
      });
    }

    // Get existing content count for order
    const existingCount = await TrainingContent.countDocuments({ trainingId, tenantId });

    const content = await TrainingContent.create({
      tenantId,
      trainingId,
      title,
      description,
      contentType: contentType || 'link',
      contentUrl,
      duration: duration ? parseInt(duration) : undefined,
      order: existingCount,
      isRequired: isRequired !== false,
      createdBy: userId,
    });

    res.status(201).json({
      success: true,
      data: content,
      message: 'Content link added successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error adding content link',
    });
  }
};

// Update content
export const updateContent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = (req as any).user.tenantId;
    const { title, description, duration, order, isRequired } = req.body;

    const content = await TrainingContent.findOneAndUpdate(
      { _id: id, tenantId },
      { title, description, duration, order, isRequired },
      { new: true }
    );

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found',
      });
    }

    res.json({
      success: true,
      data: content,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating content',
    });
  }
};

// Delete content
export const deleteContent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = (req as any).user.tenantId;

    const content = await TrainingContent.findOne({ _id: id, tenantId });
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found',
      });
    }

    // Delete file if it's a local file
    if (content.contentUrl.startsWith('/uploads/')) {
      const filePath = path.join(process.cwd(), content.contentUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // If it's a PPT with slides, delete the slides directory too
      if (content.contentType === 'ppt' && content.slides && content.slides.length > 0) {
        const slideDir = path.dirname(path.join(process.cwd(), content.slides[0]));
        if (fs.existsSync(slideDir)) {
          fs.rmSync(slideDir, { recursive: true, force: true });
        }
      }
    }

    await content.deleteOne();

    // Reorder remaining content
    const remainingContent = await TrainingContent.find({
      trainingId: content.trainingId,
      tenantId
    }).sort({ order: 1 });

    for (let i = 0; i < remainingContent.length; i++) {
      remainingContent[i].order = i;
      await remainingContent[i].save();
    }

    res.json({
      success: true,
      message: 'Content deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting content',
    });
  }
};

// Process PPT to generate slides (for existing PPT content without slides)
export const processPptSlides = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = (req as any).user.tenantId;

    const content = await TrainingContent.findOne({ _id: id, tenantId });
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found',
      });
    }

    if (content.contentType !== 'ppt') {
      return res.status(400).json({
        success: false,
        message: 'Content is not a PowerPoint file',
      });
    }

    // Check if slides already exist
    if (content.slides && content.slides.length > 0) {
      return res.json({
        success: true,
        data: content,
        message: 'Slides already exist',
      });
    }

    // Get the file path
    const filePath = path.join(process.cwd(), content.contentUrl);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Original PPT file not found',
      });
    }

    // Create output directory for slides
    const slideDir = path.join(process.cwd(), 'uploads', 'content', 'slides', path.basename(content.contentUrl, path.extname(content.contentUrl)));

    logger.info(`Processing existing PPT file: ${content.fileName}`);
    const conversionResult = await convertPptToImages(filePath, slideDir);

    if (conversionResult.success && conversionResult.slideCount > 0) {
      // Convert absolute paths to relative URLs
      const slides = conversionResult.slides.map(slidePath => {
        const relativePath = path.relative(process.cwd(), slidePath);
        return `/${relativePath.replace(/\\/g, '/')}`;
      });

      // Update the content record
      content.slides = slides;
      content.slideCount = conversionResult.slideCount;
      await content.save();

      logger.info(`PPT converted to ${conversionResult.slideCount} slides`);

      return res.json({
        success: true,
        data: content,
        message: `PPT converted to ${conversionResult.slideCount} slides`,
      });
    } else {
      return res.status(500).json({
        success: false,
        message: conversionResult.error || 'Failed to convert PPT to slides',
      });
    }
  } catch (error: any) {
    logger.error('Error processing PPT slides:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error processing PPT slides',
    });
  }
};

// Reorder content
export const reorderContent = async (req: Request, res: Response) => {
  try {
    const { trainingId } = req.params;
    const tenantId = (req as any).user.tenantId;
    const { contentIds } = req.body; // Array of content IDs in new order

    if (!Array.isArray(contentIds)) {
      return res.status(400).json({
        success: false,
        message: 'contentIds must be an array',
      });
    }

    for (let i = 0; i < contentIds.length; i++) {
      await TrainingContent.findOneAndUpdate(
        { _id: contentIds[i], trainingId, tenantId },
        { order: i }
      );
    }

    const content = await TrainingContent.find({ trainingId, tenantId }).sort({ order: 1 });

    res.json({
      success: true,
      data: content,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error reordering content',
    });
  }
};
