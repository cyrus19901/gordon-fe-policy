import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for session cookie
  const hasSession = request.cookies.has('session');

  // Public routes that don't require authentication
  const publicRoutes = [
    '/auth/login',
    '/auth/signup',
    '/auth/verify',
    '/verify',
  ];
  const isPublicRoute = publicRoutes.some(route =>
    pathname.startsWith(route)
  );

  // Allow access to public routes without session
  if (isPublicRoute) {
    // If user has session and tries to access login page, redirect to home
    if (hasSession && pathname === '/auth/login') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // Redirect root path to login if no session
  if (pathname === '/') {
    if (!hasSession) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    return NextResponse.next();
  }

  // Require session for all other routes
  if (!hasSession) {
    // Check if this is an API route or static asset
    if (pathname.startsWith('/api/') || pathname.startsWith('/_next/')) {
      return NextResponse.next();
    }

    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('session_expired', 'true');
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
