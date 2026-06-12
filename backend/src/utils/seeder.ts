import bcrypt from 'bcryptjs';
import prisma from '../prisma';

export async function seedSuperAdmin() {
  try {
    const adminEmail = 'admin@vendorbridge.com';
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash('Admin@123', 10);
      await prisma.user.create({
        data: {
          name: 'System Owner',
          email: adminEmail,
          passwordHash,
          role: 'SUPER_ADMIN'
        }
      });
      console.log('✅ SUPER_ADMIN seeded successfully.');
    } else if (existingAdmin.role !== 'SUPER_ADMIN') {
      await prisma.user.update({
        where: { email: adminEmail },
        data: { role: 'SUPER_ADMIN' }
      });
      console.log('✅ Existing admin upgraded to SUPER_ADMIN.');
    }
  } catch (error) {
    console.error('Failed to seed SUPER_ADMIN:', error);
  }
}
