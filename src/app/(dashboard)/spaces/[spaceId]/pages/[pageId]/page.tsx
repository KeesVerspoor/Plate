import { redirect, notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import PageEditor from '@/components/editor/page-editor';

interface Props {
  params: { spaceId: string; pageId: string };
}

export default async function PageDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const page = await prisma.page.findUnique({
    where: { id: params.pageId },
    include: {
      space: {
        include: {
          members: true,
        },
      },
      author: { select: { id: true, name: true } },
      parent: { select: { id: true, title: true } },
      children: {
        select: { id: true, title: true, icon: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!page) notFound();
  if (page.spaceId !== params.spaceId) notFound();

  // Check access
  const isMember = page.space.members.some((m) => m.userId === session.user.id);
  const isAdmin = session.user.role === 'ADMIN';
  if (!isMember && !isAdmin) redirect('/dashboard');

  const userMember = page.space.members.find((m) => m.userId === session.user.id);
  const canEdit = isAdmin || userMember?.role === 'OWNER' || userMember?.role === 'EDITOR';

  return (
    <PageEditor
      page={{
        id: page.id,
        title: page.title,
        content: page.content,
        icon: page.icon,
        spaceId: page.spaceId,
        parentId: page.parentId,
        parent: page.parent,
        children: page.children,
        author: page.author,
        updatedAt: page.updatedAt.toISOString(),
      }}
      canEdit={canEdit}
      spaceId={params.spaceId}
    />
  );
}
