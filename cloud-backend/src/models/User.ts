import mongoose, { Document, Schema } from 'mongoose';

export type UserRole = 'admin' | 'qa_manager' | 'pharmacist' | 'technician' | 'trainee';

export interface IUserPermissions {
  canManageUsers: boolean;
  canManageTrainings: boolean;
  canCreateExams: boolean;
  canAssignTrainings: boolean;
  canViewReports: boolean;
  canIssueCertificates: boolean;
  canManageDocuments: boolean;
}

export interface IUser extends Document {
  tenantId: mongoose.Types.ObjectId;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  department?: string;
  jobTitle?: string;
  employeeId?: string;
  phone?: string;
  permissions: IUserPermissions;
  isActive: boolean;
  emailNotifications: boolean;
  lastLogin?: Date;
  profileImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Default permissions by role
export const rolePermissions: Record<UserRole, IUserPermissions> = {
  admin: {
    canManageUsers: true,
    canManageTrainings: true,
    canCreateExams: true,
    canAssignTrainings: true,
    canViewReports: true,
    canIssueCertificates: true,
    canManageDocuments: true,
  },
  qa_manager: {
    canManageUsers: false,
    canManageTrainings: true,
    canCreateExams: true,
    canAssignTrainings: true,
    canViewReports: true,
    canIssueCertificates: true,
    canManageDocuments: true,
  },
  pharmacist: {
    canManageUsers: false,
    canManageTrainings: false,
    canCreateExams: false,
    canAssignTrainings: false,
    canViewReports: true,
    canIssueCertificates: false,
    canManageDocuments: true,
  },
  technician: {
    canManageUsers: false,
    canManageTrainings: false,
    canCreateExams: false,
    canAssignTrainings: false,
    canViewReports: false,
    canIssueCertificates: false,
    canManageDocuments: false,
  },
  trainee: {
    canManageUsers: false,
    canManageTrainings: false,
    canCreateExams: false,
    canAssignTrainings: false,
    canViewReports: false,
    canIssueCertificates: false,
    canManageDocuments: false,
  },
};

const PermissionsSchema = new Schema({
  canManageUsers: { type: Boolean, default: false },
  canManageTrainings: { type: Boolean, default: false },
  canCreateExams: { type: Boolean, default: false },
  canAssignTrainings: { type: Boolean, default: false },
  canViewReports: { type: Boolean, default: false },
  canIssueCertificates: { type: Boolean, default: false },
  canManageDocuments: { type: Boolean, default: false },
}, { _id: false });

const userSchema = new Schema<IUser>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['admin', 'qa_manager', 'pharmacist', 'technician', 'trainee'],
      default: 'trainee',
    },
    department: {
      type: String,
      trim: true,
    },
    jobTitle: {
      type: String,
      trim: true,
    },
    employeeId: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    permissions: {
      type: PermissionsSchema,
      default: () => rolePermissions.trainee,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    profileImage: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to set default permissions based on role
userSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('role')) {
    const role = this.role as UserRole;
    if (rolePermissions[role]) {
      this.permissions = rolePermissions[role];
    }
  }
  next();
});

// Indexes for faster queries
userSchema.index({ email: 1 });
userSchema.index({ tenantId: 1 });
userSchema.index({ tenantId: 1, email: 1 }, { unique: true });
userSchema.index({ isActive: 1 });
userSchema.index({ tenantId: 1, role: 1 });
userSchema.index({ tenantId: 1, department: 1 });

export const User = mongoose.model<IUser>('User', userSchema);
