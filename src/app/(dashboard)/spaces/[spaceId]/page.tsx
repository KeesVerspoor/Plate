import { redirect, notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import CreatePageButton from '@/components/pages/create-page-button';

interface Props {
  params: { spaceId: string };
}

export default async function SpacePage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const space = await prisma.space.findUnique({
    where: { id: params.spaceId },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
      pages: {
        where: { parentId: null },
        include: {
          author: { select: { id: true, name: true } },
          children: {
            include: {
              author: { select: { id: true, name: true } },
            },
          },
          _count: { select: { children: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!space) notFound();

  // Check access
  const isMember = space.members.some((m) => m.userId === session.user.id);
  const isAdmin = session.user.role === 'ADMIN';
  if (!isMember && !isAdmin) redirect('/dashboard');

  const userMember = space.members.find((m) => m.userId === session.user.id);
  const canEdit = isAdmin || userMember?.role === 'OWNER' || userMember?.role === 'EDITOR';

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="text-4xl">{space.icon}</div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{space.name}</h1>
            {space.description && (
              <p className="text-gray-500 mt-1">{space.description}</p>
            )}
            <div className="flex items-center gap-3 mt-2 text-sm text-gray-400">
              <span>{space.pages.length} pages</span>
              <span>·</span>
              <span>{space.members.length} members</span>
              <span>·</span>
              <span>Created {formatDate(space.createdAt)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(isAdmin || userMember?.role === 'OWNER') && (
            <Link
              href={`/spaces/${space.id}/settings`}
              className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Settings
            </Link>
          )}
          {canEdit && (
            <CreatePageButton spaceId={space.id} />
          )}
        </div>
      </div>

      {space.pages.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <div className="text-4xl mb-4">📄</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No pages yet</h3>
          <p className="text-gray-500 mb-6">Create your first page to get started</p>
          {canEdit && <CreatePageButton spaceId={space.id} />}
        </div>
      ) : (
        <div className="space-y-3">
          {space.pages.map((page) => (
            <div key={page.id}>
              <Link
                href={`/spaces/${space.id}/pages/${page.id}`}
                className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 hover:shadow-sm transition-all group"
              >
                <div className="text-xl">{page.icon || '📄'}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                    {page.title}
                  </div>
                  <div className="text-sm text-gray-400 mt-0.5">
                    By {page.author.name} · Updated {formatDate(page.updatedAt)}
                    {page._count.children > 0 && ` · ${page._count.children} subpages`}
                  </div>
                </div>
              </Link>
              {page.children.length > 0 && (
                <div className="ml-8 mt-1 space-y-1">
                  {page.children.map((child) => (
                    <Link
                      key={child.id}
                      href={`/spaces/${space.id}/pages/${child.id}`}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <span>{child.icon || '📄'}</span>
                      <span>{child.title}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
