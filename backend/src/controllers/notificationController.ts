import { Response } from 'express';
import prisma from '../prisma';
import { AuthenticatedRequest } from '../middleware/auth';

export async function getNotifications(req: AuthenticatedRequest, res: Response) {
  const user = req.user;

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: user!.id },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(notifications);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function markAsRead(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;

  try {
    const notification = await prisma.notification.findUnique({
      where: { id: parseInt(id) },
    });

    if (!notification || notification.userId !== req.user!.id) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const updated = await prisma.notification.update({
      where: { id: notification.id },
      data: { isRead: true },
    });

    return res.json(updated);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function markAllAsRead(req: AuthenticatedRequest, res: Response) {
  const user = req.user;

  try {
    await prisma.notification.updateMany({
      where: { userId: user!.id, isRead: false },
      data: { isRead: true },
    });

    return res.json({ message: 'All notifications marked as read' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function clearNotification(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;

  try {
    const notification = await prisma.notification.findUnique({
      where: { id: parseInt(id) },
    });

    if (!notification || notification.userId !== req.user!.id) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await prisma.notification.delete({
      where: { id: notification.id },
    });

    return res.json({ message: 'Notification cleared' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
