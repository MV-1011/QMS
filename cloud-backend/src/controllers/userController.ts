import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { User, rolePermissions, UserRole } from '../models/User';

// Get all users (admin only)
export const getUsers = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;
    const { role, department, isActive } = req.query;

    const filter: any = { tenantId };
    if (role) filter.role = role;
    if (department) filter.department = department;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const users = await User.find(filter)
      .select('-passwordHash')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: users });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get user by ID
export const getUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = (req as any).user.tenantId;

    const user = await User.findOne({ _id: id, tenantId }).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create user (admin only)
export const createUser = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;
    const {
      email,
      password,
      firstName,
      lastName,
      role,
      department,
      jobTitle,
      employeeId,
      phone,
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ tenantId, email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      tenantId,
      email,
      passwordHash,
      firstName,
      lastName,
      role: role || 'trainee',
      department,
      jobTitle,
      employeeId,
      phone,
      permissions: rolePermissions[role as UserRole] || rolePermissions.trainee,
      isActive: true,
      emailNotifications: true,
    });

    // Remove password hash from response
    const userResponse = user.toObject();
    delete (userResponse as any).passwordHash;

    res.status(201).json({ success: true, data: userResponse });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update user
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = (req as any).user.tenantId;
    const currentUserId = (req as any).user.id;
    const currentUserRole = (req as any).user.role;
    const {
      firstName,
      lastName,
      role,
      department,
      jobTitle,
      employeeId,
      phone,
      isActive,
      emailNotifications,
    } = req.body;

    // Users can only update their own profile (except admins)
    if (currentUserRole !== 'admin' && id !== currentUserId) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this user' });
    }

    // Non-admins cannot change role or active status
    const updateData: any = {
      firstName,
      lastName,
      department,
      jobTitle,
      phone,
      emailNotifications,
    };

    if (currentUserRole === 'admin') {
      if (role) {
        updateData.role = role;
        updateData.permissions = rolePermissions[role as UserRole];
      }
      if (isActive !== undefined) updateData.isActive = isActive;
      if (employeeId) updateData.employeeId = employeeId;
    }

    const user = await User.findOneAndUpdate(
      { _id: id, tenantId },
      updateData,
      { new: true }
    ).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Change password
export const changePassword = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = (req as any).user.tenantId;
    const currentUserId = (req as any).user.id;
    const currentUserRole = (req as any).user.role;
    const { currentPassword, newPassword } = req.body;

    // Users can only change their own password (admins can reset any)
    if (currentUserRole !== 'admin' && id !== currentUserId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const user = await User.findOne({ _id: id, tenantId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // If not admin, verify current password
    if (currentUserRole !== 'admin') {
      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect' });
      }
    }

    // Hash new password
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete user (deactivate)
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = (req as any).user.tenantId;
    const currentUserId = (req as any).user.id;

    // Cannot delete yourself
    if (id === currentUserId) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }

    const user = await User.findOneAndUpdate(
      { _id: id, tenantId },
      { isActive: false },
      { new: true }
    ).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, message: 'User deactivated successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get current user profile
export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const tenantId = (req as any).user.tenantId;

    const user = await User.findOne({ _id: userId, tenantId }).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get users by role (for training assignment)
export const getUsersByRole = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;
    const { roles } = req.query;

    const filter: any = { tenantId, isActive: true };
    if (roles) {
      filter.role = { $in: (roles as string).split(',') };
    }

    const users = await User.find(filter)
      .select('_id firstName lastName email role department')
      .sort({ lastName: 1, firstName: 1 });

    res.json({ success: true, data: users });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
