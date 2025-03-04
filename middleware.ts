// middleware.ts - Route protection middleware based on authentication status
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define which routes should be protected (require authentication)
const protectedRoutes = ['/subscriptions'];

// Define routes that should only be accessible by non-authenticated users
const authRoutes = ['/login', '/signup'];

export async function middleware(req: NextRequest) {
  // Create a Supabase client for the middleware
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Get the current session
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const pathname = req.nextUrl.pathname;

  // Redirect authenticated users away from auth pages
  if (session && authRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Redirect unauthenticated users away from protected pages
  if (!session && protectedRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return res;
}

// Specify which routes the middleware should be applied to
export const config = {
  // Apply to all routes except api routes, static files, and _next
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images and other static assets
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api).*)',
  ],
};
