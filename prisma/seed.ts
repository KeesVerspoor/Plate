import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  console.log(`Created admin user: ${admin.email}`);

  // Create a sample space
  const space = await prisma.space.upsert({
    where: { id: 'sample-space-id' },
    update: {},
    create: {
      id: 'sample-space-id',
      name: 'My Workspace',
      description: 'A sample workspace to get started',
      icon: '🚀',
      ownerId: admin.id,
    },
  });

  console.log(`Created sample space: ${space.name}`);

  // Add admin as space member with OWNER role
  await prisma.spaceMember.upsert({
    where: {
      spaceId_userId: {
        spaceId: space.id,
        userId: admin.id,
      },
    },
    update: {},
    create: {
      spaceId: space.id,
      userId: admin.id,
      role: 'OWNER',
    },
  });

  // Create a sample page
  const sampleContent = JSON.stringify([
    {
      id: '1',
      type: 'h1',
      children: [{ text: 'Welcome to Plate Notion!' }],
    },
    {
      id: '2',
      type: 'p',
      children: [{ text: 'This is a rich text editor built with PlateJS. You can format text with ' }, { text: 'bold', bold: true }, { text: ', ' }, { text: 'italic', italic: true }, { text: ', and more.' }],
    },
    {
      id: '3',
      type: 'h2',
      children: [{ text: 'Features' }],
    },
    {
      id: '4',
      type: 'ul',
      children: [
        {
          id: '5',
          type: 'li',
          children: [{ id: '6', type: 'lic', children: [{ text: 'Rich text editing with PlateJS' }] }],
        },
        {
          id: '7',
          type: 'li',
          children: [{ id: '8', type: 'lic', children: [{ text: 'Auto-save functionality' }] }],
        },
        {
          id: '9',
          type: 'li',
          children: [{ id: '10', type: 'lic', children: [{ text: 'Nested pages' }] }],
        },
      ],
    },
    {
      id: '11',
      type: 'blockquote',
      children: [{ text: 'Start creating amazing content!' }],
    },
  ]);

  await prisma.page.upsert({
    where: { id: 'sample-page-id' },
    update: {},
    create: {
      id: 'sample-page-id',
      title: 'Getting Started',
      content: sampleContent,
      icon: '👋',
      spaceId: space.id,
      authorId: admin.id,
    },
  });

  console.log('Created sample page');
  console.log('\nSeed complete!');
  console.log('Admin credentials: admin@example.com / admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
