import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files, API routes, and login page
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/uploads') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next();
  }

  // Disable password protection in local development (check hostname)
  const isLocalDevelopment = 
    request.nextUrl.hostname === 'localhost' || 
    request.nextUrl.hostname === '127.0.0.1' ||
    request.nextUrl.hostname.includes('localhost') ||
    process.env.NODE_ENV !== 'production';

  // Skip password protection entirely in local development
  if (isLocalDevelopment) {
    // Continue with locale handling below, skip auth checks
  } else {
    // Production: Check authentication cookie
    const authCookie = request.cookies.get('site_auth');
    const isAuthenticated = authCookie?.value === 'authenticated';

    // Redirect to login if not authenticated (except for login page itself)
    if (!isAuthenticated && pathname !== '/login') {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Redirect authenticated users away from login page
    if (isAuthenticated && pathname === '/login') {
      const redirectTo = request.nextUrl.searchParams.get('redirect') || '/sk';
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }
  }
  
  // Skip middleware for admin routes, checkout (they handle their own auth if needed)
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/checkout')
  ) {
    return NextResponse.next();
  }

  // Check if pathname already has locale prefix
  const localeMatch = pathname.match(/^\/(sk|en)(\/|$)/);
  
  if (localeMatch) {
    // Already has locale, continue
    return NextResponse.next();
  }

  // Root path - redirect to /sk (default locale)
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/sk', request.url));
  }

  // Default to 'sk' if no locale specified
  const locale = 'sk';
  const newUrl = new URL(`/${locale}${pathname}`, request.url);
  newUrl.search = request.nextUrl.search;
  
  return NextResponse.rewrite(newUrl);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
