import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/session';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let spaces;
    if (session.user.role === 'ADMIN') {
      spaces = await prisma.space.findMany({
        include: {
          owner: { select: { id: true, name: true, email: true } },
          members: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
          _count: { select: { pages: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      spaces = await prisma.space.findMany({
        where: {
          members: {
            some: { userId: session.user.id },
          },
        },
        include: {
          owner: { select: { id: true, name: true, email: true } },
          members: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
          _count: { select: { pages: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return NextResponse.json(spaces);
  } catch (error) {
    console.error('Error fetching spaces:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description, icon } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const space = await prisma.space.create({
      data: {
        name,
        description,
        icon: icon || '📄',
        ownerId: session.user.id,
        members: {
          create: {
            userId: session.user.id,
            role: 'OWNER',
          },
        },
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    return NextResponse.json(space, { status: 201 });
  } catch (error) {
    console.error('Error creating space:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
