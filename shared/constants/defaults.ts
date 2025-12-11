export const DEFAULT_BRANDING = {
  name: 'E-QMS Pharmacy',
  primaryColor: '#0066cc',
  secondaryColor: '#4a90e2',
};

export const DEFAULT_FEATURES = {
  documentControl: true,
  changeControl: true,
  deviations: true,
  capa: true,
  audits: true,
  training: true,
  equipment: true,
  suppliers: true,
  complaints: true,
};

export const DEFAULT_SETTINGS = {
  language: 'en',
  timezone: 'UTC',
  dateFormat: 'YYYY-MM-DD',
};

export const USER_ROLES = {
  ADMIN: 'admin',
  QUALITY_MANAGER: 'quality_manager',
  SUPERVISOR: 'supervisor',
  USER: 'user',
  VIEWER: 'viewer',
} as const;

export const DOCUMENT_STATUS = {
  DRAFT: 'draft',
  IN_REVIEW: 'in_review',
  APPROVED: 'approved',
  OBSOLETE: 'obsolete',
} as const;

export const CHANGE_STATUS = {
  INITIATED: 'initiated',
  IN_REVIEW: 'in_review',
  APPROVED: 'approved',
  IMPLEMENTED: 'implemented',
  CLOSED: 'closed',
  REJECTED: 'rejected',
} as const;
