// backend/prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  try {
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'Admin',
      },
    });

    console.log('✅ Admin user created:', adminUser.email);

    const managerUser = await prisma.user.upsert({
      where: { email: 'manager@example.com' },
      update: {},
      create: {
        email: 'manager@example.com',
        password: await bcrypt.hash('manager123', 12),
        role: 'Manager',
      },
    });

    console.log('✅ Manager user created:', managerUser.email);

    const viewerUser = await prisma.user.upsert({
      where: { email: 'viewer@example.com' },
      update: {},
      create: {
        email: 'viewer@example.com',
        password: await bcrypt.hash('viewer123', 12),
        role: 'Viewer',
      },
    });

    console.log('✅ Viewer user created:', viewerUser.email);

    console.log('🎉 Database seeded successfully!');
    console.log('📧 Login credentials:');
    console.log('   Admin: admin@example.com / admin123');
    console.log('   Manager: manager@example.com / manager123');
    console.log('   Viewer: viewer@example.com / viewer123');
  } catch (error) {
    console.error('❌ Seeding error:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });