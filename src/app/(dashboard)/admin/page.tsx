import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'ADMIN') redirect('/dashboard');

  const [userCount, spaceCount, pageCount, recentUsers] = await Promise.all([
    prisma.user.count(),
    prisma.space.count(),
    prisma.page.count(),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
  ]);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Manage users, spaces, and content</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="text-3xl font-bold text-gray-900">{userCount}</div>
          <div className="text-sm text-gray-500 mt-1">Total Users</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="text-3xl font-bold text-gray-900">{spaceCount}</div>
          <div className="text-sm text-gray-500 mt-1">Total Spaces</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="text-3xl font-bold text-gray-900">{pageCount}</div>
          <div className="text-sm text-gray-500 mt-1">Total Pages</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Users</h2>
            <Link href="/admin/users" className="text-sm text-blue-600 hover:text-blue-700">
              Manage users →
            </Link>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Joined</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 text-sm">{user.name}</div>
                      <div className="text-xs text-gray-400">{user.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        user.role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {formatDate(user.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              href="/admin/users"
              className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 hover:shadow-sm transition-all"
            >
              <div className="text-2xl">👥</div>
              <div>
                <div className="font-medium text-gray-900">Manage Users</div>
                <div className="text-sm text-gray-500">Create, edit, and delete users</div>
              </div>
            </Link>
            <Link
              href="/spaces"
              className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 hover:shadow-sm transition-all"
            >
              <div className="text-2xl">🏢</div>
              <div>
                <div className="font-medium text-gray-900">Manage Spaces</div>
                <div className="text-sm text-gray-500">View and manage all spaces</div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
