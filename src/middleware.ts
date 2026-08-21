import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const authCookie = request.cookies.get('admin_auth');
  
  // Exclude login page, home page, api routes, and POS terminal
  if (
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/pos') ||
    request.nextUrl.pathname === '/'
  ) {
    return NextResponse.next();
  }

  // Redirect to login if not authenticated
  if (!authCookie || authCookie.value !== 'authenticated') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/billing/:path*',
    '/products/:path*',
    '/inventory/:path*',
    '/prices/:path*',
    '/reports/:path*',
    '/history/:path*',
    '/settings/:path*',
  ],
};
