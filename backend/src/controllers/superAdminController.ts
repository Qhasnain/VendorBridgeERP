import { Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../prisma';
import { AuthenticatedRequest } from '../middleware/auth';

export async function createUser(req: AuthenticatedRequest, res: Response) {
  try {
    const { name, email, password, role } = req.body;
    
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const passwordHash = await bcrypt.hash(password || 'VendorBridge@123', 10);
    
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: role || 'PROCUREMENT_OFFICER'
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user?.id,
        action: 'SUPER_ADMIN_CREATE_USER',
        details: `Created new user ${email} with role ${role}`
      }
    });

    return res.status(201).json(user);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function updateUser(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { name, email, role, password } = req.body;

    const updateData: any = { name, email, role };
    
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: { id: true, name: true, email: true, role: true }
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user?.id,
        action: 'SUPER_ADMIN_UPDATE_USER',
        details: `Updated user ${email} profiles/roles`
      }
    });

    return res.json(user);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function deleteUser(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id: parseInt(id) } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    if (user.role === 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Cannot delete a SUPER_ADMIN' });
    }

    await prisma.user.delete({ where: { id: parseInt(id) } });

    await prisma.activityLog.create({
      data: {
        userId: req.user?.id,
        action: 'SUPER_ADMIN_DELETE_USER',
        details: `Deleted user ${user.email}`
      }
    });

    return res.json({ success: true, message: 'User deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
