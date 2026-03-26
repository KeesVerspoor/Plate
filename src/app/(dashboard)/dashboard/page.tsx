import { auth } from '@/lib/session';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) return null;

  let spaces;
  if (session.user.role === 'ADMIN') {
    spaces = await prisma.space.findMany({
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { pages: true, members: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  } else {
    spaces = await prisma.space.findMany({
      where: {
        members: { some: { userId: session.user.id } },
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { pages: true, members: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  const recentPages = await prisma.page.findMany({
    where: session.user.role === 'ADMIN'
      ? {}
      : {
          space: {
            members: { some: { userId: session.user.id } },
          },
        },
    include: {
      space: { select: { id: true, name: true, icon: true } },
      author: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 5,
  });

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {session.user.name}! 👋
        </h1>
        <p className="text-gray-500 mt-1">Here&apos;s an overview of your workspaces</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="text-2xl font-bold text-gray-900">{spaces.length}</div>
          <div className="text-sm text-gray-500 mt-1">Total Spaces</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="text-2xl font-bold text-gray-900">
            {spaces.reduce((acc, s) => acc + s._count.pages, 0)}
          </div>
          <div className="text-sm text-gray-500 mt-1">Total Pages</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="text-2xl font-bold text-gray-900">{recentPages.length}</div>
          <div className="text-sm text-gray-500 mt-1">Recent Activity</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Your Spaces</h2>
            <Link href="/spaces" className="text-sm text-blue-600 hover:text-blue-700">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {spaces.length === 0 ? (
              <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-6 text-center text-gray-500">
                No spaces yet. Create your first space!
              </div>
            ) : (
              spaces.slice(0, 4).map((space) => (
                <Link
                  key={space.id}
                  href={`/spaces/${space.id}`}
                  className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 hover:shadow-sm transition-all"
                >
                  <div className="text-2xl">{space.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{space.name}</div>
                    <div className="text-sm text-gray-500">
                      {space._count.pages} pages · {space._count.members} members
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Pages</h2>
          <div className="space-y-3">
            {recentPages.length === 0 ? (
              <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-6 text-center text-gray-500">
                No pages yet.
              </div>
            ) : (
              recentPages.map((page) => (
                <Link
                  key={page.id}
                  href={`/spaces/${page.spaceId}/pages/${page.id}`}
                  className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 hover:shadow-sm transition-all"
                >
                  <div className="text-xl">{page.icon || '📄'}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{page.title}</div>
                    <div className="text-sm text-gray-500">
                      {page.space.icon} {page.space.name} · {formatDate(page.updatedAt)}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
