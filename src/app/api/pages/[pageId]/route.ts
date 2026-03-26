import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/session';
import { prisma } from '@/lib/db';

interface Params {
  params: { pageId: string };
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const page = await prisma.page.findUnique({
      where: { id: params.pageId },
      include: {
        space: {
          include: { members: true },
        },
        author: { select: { id: true, name: true } },
        parent: { select: { id: true, title: true } },
        children: {
          select: { id: true, title: true, icon: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    const isMember = page.space.members.some((m) => m.userId === session.user.id);
    const isAdmin = session.user.role === 'ADMIN';

    if (!isMember && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(page);
  } catch (error) {
    console.error('Error fetching page:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const page = await prisma.page.findUnique({
      where: { id: params.pageId },
      include: {
        space: {
          include: { members: true },
        },
      },
    });

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    const userMember = page.space.members.find((m) => m.userId === session.user.id);
    const isAdmin = session.user.role === 'ADMIN';

    if (!isAdmin && !userMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!isAdmin && userMember?.role === 'VIEWER') {
      return NextResponse.json({ error: 'Viewers cannot edit pages' }, { status: 403 });
    }

    const { title, content, icon } = await req.json();

    const updatedPage = await prisma.page.update({
      where: { id: params.pageId },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(icon !== undefined && { icon }),
      },
      include: {
        author: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(updatedPage);
  } catch (error) {
    console.error('Error updating page:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const page = await prisma.page.findUnique({
      where: { id: params.pageId },
      include: {
        space: {
          include: { members: true },
        },
      },
    });

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    const userMember = page.space.members.find((m) => m.userId === session.user.id);
    const isAdmin = session.user.role === 'ADMIN';

    if (!isAdmin && !userMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!isAdmin && userMember?.role === 'VIEWER') {
      return NextResponse.json({ error: 'Viewers cannot delete pages' }, { status: 403 });
    }

    await prisma.page.delete({ where: { id: params.pageId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting page:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
