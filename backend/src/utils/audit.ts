import prisma from '../prisma';

export async function createAuditLog(
  userId: number | null,
  action: string,
  details: string,
  ipAddress?: string
) {
  try {
    return await prisma.activityLog.create({
      data: {
        userId,
        action,
        details,
        ipAddress: ipAddress || 'SYSTEM',
      },
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}
