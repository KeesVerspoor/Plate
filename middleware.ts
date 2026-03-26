import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const isAuthenticated = !!req.nextauth?.token;

    const publicPaths = ['/login', '/register'];
    const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

    if (isAuthenticated && isPublicPath) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ token, req }) {
        const { pathname } = req.nextUrl;
        const publicPaths = ['/login', '/register'];
        if (publicPaths.some((p) => pathname.startsWith(p))) return true;
        return !!token;
      },
    },
    pages: {
      signIn: '/login',
    },
  }
);

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
