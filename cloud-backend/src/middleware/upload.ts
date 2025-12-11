import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure upload directories exist
const uploadDirs = ['uploads/trainings', 'uploads/certificates', 'uploads/content', 'uploads/content/slides'];
uploadDirs.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// Storage configuration for training content
const contentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/content');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `content-${uniqueSuffix}${ext}`);
  },
});

// Storage configuration for certificate templates
const certificateStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/certificates');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `cert-${uniqueSuffix}${ext}`);
  },
});

// File filter for training content
const contentFileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    // Videos
    'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
    // Documents
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    // Images (for slides/diagrams)
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    // Archive for SCORM
    'application/zip', 'application/x-zip-compressed',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`));
  }
};

// File filter for certificate images
const imageFileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed for certificates'));
  }
};

// Upload middleware for training content
export const uploadContent = multer({
  storage: contentStorage,
  fileFilter: contentFileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max for videos
  },
});

// Upload middleware for certificate templates/signatures/logos
export const uploadCertificateAssets = multer({
  storage: certificateStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max for images
  },
});

// Get content type from mimetype
export const getContentType = (mimetype: string): string => {
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype === 'application/pdf') return 'pdf';
  if (mimetype.includes('powerpoint') || mimetype.includes('presentation')) return 'ppt';
  if (mimetype.includes('word') || mimetype.includes('document')) return 'document';
  if (mimetype.includes('zip')) return 'scorm';
  return 'document';
};

export default { uploadContent, uploadCertificateAssets, getContentType };
