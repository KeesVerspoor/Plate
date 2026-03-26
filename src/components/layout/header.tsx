'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface User {
  id?: string;
  name?: string | null;
  email?: string | null;
  role?: string;
}

interface HeaderProps {
  user: User;
}

export default function Header({ user }: HeaderProps) {
  const pathname = usePathname();

  // Build breadcrumbs from pathname
  const parts = pathname.split('/').filter(Boolean);
  const breadcrumbs = parts.map((part, index) => {
    const href = '/' + parts.slice(0, index + 1).join('/');
    const label = part.charAt(0).toUpperCase() + part.slice(1);
    return { href, label };
  });

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 h-14">
      <nav className="flex items-center gap-1 text-sm text-gray-500">
        <Link href="/dashboard" className="hover:text-gray-800 transition-colors">
          Home
        </Link>
        {breadcrumbs.length > 0 && breadcrumbs[0].label !== 'Dashboard' && (
          <>
            {breadcrumbs.map((crumb, i) => (
              <span key={crumb.href} className="flex items-center gap-1">
                <span>/</span>
                {i === breadcrumbs.length - 1 ? (
                  <span className="text-gray-800 font-medium">{crumb.label}</span>
                ) : (
                  <Link href={crumb.href} className="hover:text-gray-800 transition-colors">
                    {crumb.label}
                  </Link>
                )}
              </span>
            ))}
          </>
        )}
      </nav>

      <div className="flex items-center gap-3">
        {user.role === 'ADMIN' && (
          <span className="text-xs bg-gray-900 text-white px-2 py-0.5 rounded-full font-medium">
            Admin
          </span>
        )}
        <span className="text-sm text-gray-600">{user.name}</span>
      </div>
    </header>
  );
}
