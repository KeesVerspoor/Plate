import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

interface Params {
  params: { spaceId: string };
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const space = await prisma.space.findUnique({
      where: { id: params.spaceId },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        _count: { select: { pages: true } },
      },
    });

    if (!space) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 });
    }

    const isMember = space.members.some((m) => m.userId === session.user.id);
    const isAdmin = session.user.role === 'ADMIN';

    if (!isMember && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(space);
  } catch (error) {
    console.error('Error fetching space:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const space = await prisma.space.findUnique({
      where: { id: params.spaceId },
      include: { members: true },
    });

    if (!space) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 });
    }

    const userMember = space.members.find((m) => m.userId === session.user.id);
    const isAdmin = session.user.role === 'ADMIN';

    if (!isAdmin && userMember?.role !== 'OWNER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { name, description, icon } = await req.json();

    const updatedSpace = await prisma.space.update({
      where: { id: params.spaceId },
      data: { name, description, icon },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    return NextResponse.json(updatedSpace);
  } catch (error) {
    console.error('Error updating space:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const space = await prisma.space.findUnique({
      where: { id: params.spaceId },
      include: { members: true },
    });

    if (!space) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 });
    }

    const userMember = space.members.find((m) => m.userId === session.user.id);
    const isAdmin = session.user.role === 'ADMIN';

    if (!isAdmin && userMember?.role !== 'OWNER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.space.delete({ where: { id: params.spaceId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting space:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
