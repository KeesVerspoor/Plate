import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/session';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const spaceId = searchParams.get('spaceId');
    const parentId = searchParams.get('parentId');

    if (!spaceId) {
      return NextResponse.json({ error: 'spaceId is required' }, { status: 400 });
    }

    // Check access
    const space = await prisma.space.findUnique({
      where: { id: spaceId },
      include: { members: true },
    });

    if (!space) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 });
    }

    const isMember = space.members.some((m) => m.userId === session.user.id);
    const isAdmin = session.user.role === 'ADMIN';

    if (!isMember && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const pages = await prisma.page.findMany({
      where: {
        spaceId,
        parentId: parentId || null,
      },
      include: {
        author: { select: { id: true, name: true } },
        children: {
          select: { id: true, title: true, icon: true },
        },
        _count: { select: { children: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(pages);
  } catch (error) {
    console.error('Error fetching pages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { spaceId, parentId, title, icon } = await req.json();

    if (!spaceId) {
      return NextResponse.json({ error: 'spaceId is required' }, { status: 400 });
    }

    // Check access
    const space = await prisma.space.findUnique({
      where: { id: spaceId },
      include: { members: true },
    });

    if (!space) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 });
    }

    const userMember = space.members.find((m) => m.userId === session.user.id);
    const isAdmin = session.user.role === 'ADMIN';

    if (!isAdmin && !userMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!isAdmin && userMember?.role === 'VIEWER') {
      return NextResponse.json({ error: 'Viewers cannot create pages' }, { status: 403 });
    }

    const page = await prisma.page.create({
      data: {
        title: title || 'Untitled',
        icon: icon || null,
        spaceId,
        parentId: parentId || null,
        authorId: session.user.id,
        content: JSON.stringify([
          {
            id: '1',
            type: 'h1',
            children: [{ text: title || 'Untitled' }],
          },
          {
            id: '2',
            type: 'p',
            children: [{ text: '' }],
          },
        ]),
      },
      include: {
        author: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(page, { status: 201 });
  } catch (error) {
    console.error('Error creating page:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
