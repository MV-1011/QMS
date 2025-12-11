import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/authRoutes';
import documentRoutes from './routes/documentRoutes';
import changeControlRoutes from './routes/changeControlRoutes';
import deviationRoutes from './routes/deviationRoutes';
import capaRoutes from './routes/capaRoutes';
import auditRoutes from './routes/auditRoutes';
import trainingRoutes from './routes/trainingRoutes';
import reportRoutes from './routes/reportRoutes';
import userRoutes from './routes/userRoutes';
import notificationRoutes from './routes/notificationRoutes';
import trainingAssignmentRoutes from './routes/trainingAssignmentRoutes';
import examRoutes from './routes/examRoutes';
import certificateRoutes from './routes/certificateRoutes';
import trainingContentRoutes from './routes/trainingContentRoutes';
import { connectDatabase } from './config/database';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;
const API_VERSION = process.env.API_VERSION || 'v1';

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.',
});
app.use(`/api/${API_VERSION}`, limiter);

// Serve static files (uploads) with CORS headers for content viewing
app.use('/uploads', (req, res, next) => {
  // Set headers to allow embedding content in iframes and direct access
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
}, express.static(path.join(process.cwd(), 'uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use(`/api/${API_VERSION}/auth`, authRoutes);
app.use(`/api/${API_VERSION}/documents`, documentRoutes);
app.use(`/api/${API_VERSION}/change-controls`, changeControlRoutes);
app.use(`/api/${API_VERSION}/deviations`, deviationRoutes);
app.use(`/api/${API_VERSION}/capas`, capaRoutes);
app.use(`/api/${API_VERSION}/audits`, auditRoutes);
app.use(`/api/${API_VERSION}/trainings`, trainingRoutes);
app.use(`/api/${API_VERSION}/reports`, reportRoutes);
app.use(`/api/${API_VERSION}/users`, userRoutes);
app.use(`/api/${API_VERSION}/notifications`, notificationRoutes);
app.use(`/api/${API_VERSION}/training-assignments`, trainingAssignmentRoutes);
app.use(`/api/${API_VERSION}/exams`, examRoutes);
app.use(`/api/${API_VERSION}/certificates`, certificateRoutes);
app.use(`/api/${API_VERSION}/training-content`, trainingContentRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDatabase();

    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📡 API version: ${API_VERSION}`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
