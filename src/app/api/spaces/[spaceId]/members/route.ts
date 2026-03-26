import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/session';
import { prisma } from '@/lib/db';

interface Params {
  params: { spaceId: string };
}

export async function POST(req: NextRequest, { params }: Params) {
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

    const { email, role } = await req.json();

    const userToAdd = await prisma.user.findUnique({ where: { email } });
    if (!userToAdd) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const existingMember = space.members.find((m) => m.userId === userToAdd.id);
    if (existingMember) {
      return NextResponse.json({ error: 'User is already a member' }, { status: 400 });
    }

    const member = await prisma.spaceMember.create({
      data: {
        spaceId: params.spaceId,
        userId: userToAdd.id,
        role: role || 'VIEWER',
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error('Error adding member:', error);
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

    const { memberId, role } = await req.json();

    const member = await prisma.spaceMember.update({
      where: { id: memberId },
      data: { role },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(member);
  } catch (error) {
    console.error('Error updating member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
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

    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get('memberId');

    if (!memberId) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
    }

    const memberToRemove = await prisma.spaceMember.findUnique({
      where: { id: memberId },
    });

    if (!memberToRemove) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    if (memberToRemove.role === 'OWNER') {
      return NextResponse.json({ error: 'Cannot remove the owner' }, { status: 400 });
    }

    await prisma.spaceMember.delete({ where: { id: memberId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
