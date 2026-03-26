'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';

interface User {
  id?: string;
  name?: string | null;
  email?: string | null;
  role?: string;
}

interface Space {
  id: string;
  name: string;
  icon: string;
}

interface SidebarProps {
  user: User;
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    fetch('/api/spaces')
      .then((r) => r.json())
      .then((data) => setSpaces(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [pathname]);

  const navItems = [
    { href: '/dashboard', label: 'Home', icon: '🏠' },
    { href: '/spaces', label: 'Spaces', icon: '📂' },
  ];

  if (user.role === 'ADMIN') {
    navItems.push({ href: '/admin', label: 'Admin', icon: '⚙️' });
  }

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-gray-50 border-r border-gray-200 transition-all duration-200',
        collapsed ? 'w-14' : 'w-60'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        {!collapsed && (
          <span className="font-semibold text-gray-800 text-sm truncate">📝 Plate Notion</span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors ml-auto"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors',
              pathname === item.href || pathname.startsWith(item.href + '/')
                ? 'bg-gray-200 text-gray-900 font-medium'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            )}
            title={collapsed ? item.label : undefined}
          >
            <span className="text-base flex-shrink-0">{item.icon}</span>
            {!collapsed && <span className="truncate">{item.label}</span>}
          </Link>
        ))}

        {/* Spaces section */}
        {spaces.length > 0 && !collapsed && (
          <div className="mt-4">
            <div className="px-2.5 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Spaces
            </div>
            {spaces.map((space) => (
              <Link
                key={space.id}
                href={`/spaces/${space.id}`}
                className={cn(
                  'flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm transition-colors',
                  pathname.startsWith(`/spaces/${space.id}`)
                    ? 'bg-gray-200 text-gray-900 font-medium'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <span className="text-base flex-shrink-0">{space.icon}</span>
                <span className="truncate">{space.name}</span>
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* User section */}
      <div className="p-2 border-t border-gray-200">
        {!collapsed ? (
          <div className="flex items-center gap-2 px-2.5 py-2">
            <div className="w-7 h-7 rounded-full bg-gray-700 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
              {user.name?.charAt(0).toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-800 truncate">{user.name}</div>
              <div className="text-xs text-gray-400 truncate">{user.email}</div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
              title="Sign out"
            >
              ↪
            </button>
          </div>
        ) : (
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            title="Sign out"
          >
            ↪
          </button>
        )}
      </div>
    </aside>
  );
}
