import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../prisma';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { createAuditLog } from '../utils/audit';

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { vendors: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await createAuditLog(
      user.id,
      'LOGIN',
      `User ${user.email} successfully logged in.`,
      req.ip
    );

    return res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        vendorId: user.vendors?.id || null,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

export async function signup(req: Request, res: Response) {
  const { name, email, password, role, companyName, category, gstNumber, panNumber, contactPerson, phone, address } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Name, email, password, and role are required' });
  }

  if (role === 'VENDOR' && (!companyName || !gstNumber || !panNumber || !phone || !address)) {
    return res.status(400).json({ error: 'Vendor profile details are required for vendor signups' });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
      },
    });

    let vendorProfile = null;
    if (role === 'VENDOR') {
      const vendorCount = await prisma.vendor.count();
      const vendorIdString = `VEND-${String(vendorCount + 1).padStart(6, '0')}`;

      vendorProfile = await prisma.vendor.create({
        data: {
          userId: user.id,
          vendorId: vendorIdString,
          companyName,
          category: category || 'General Support Services',
          gstNumber,
          panNumber,
          contactPerson: contactPerson || name,
          email,
          phone,
          address,
          status: 'PENDING', // starts pending admin approval
        },
      });

      await createAuditLog(
        user.id,
        'VENDOR_CREATION',
        `Vendor profile registration initiated for ${companyName} (${vendorIdString}).`,
        req.ip
      );
    } else {
      await createAuditLog(
        user.id,
        'USER_CREATION',
        `User ${email} signed up with role ${role}.`,
        req.ip
      );
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return res.status(201).json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        vendorId: vendorProfile?.id || null,
      },
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

export async function refresh(req: Request, res: Response) {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is required' });
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { vendors: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'User session not found' });
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    const newAccessToken = generateAccessToken(payload);
    return res.json({ accessToken: newAccessToken });
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired refresh token' });
  }
}

export async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Mock sending email
  console.log(`[EMAIL AUTOMATION] Password reset link requested for ${email}`);
  await createAuditLog(null, 'AUTH_PASSWORD_RESET_REQUEST', `Password reset link requested for ${email}`, req.ip);

  return res.json({ message: 'If the email exists, a password reset link has been dispatched.' });
}

export async function resetPassword(req: Request, res: Response) {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ error: 'Email and new password are required' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ error: 'No user account found with this email address' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    await prisma.user.update({
      where: { email },
      data: { passwordHash },
    });

    await createAuditLog(user.id, 'AUTH_PASSWORD_RESET', `Password successfully reset for ${email}`, req.ip);

    return res.json({ message: 'Password has been successfully updated.' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
