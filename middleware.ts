import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  // Create a Supabase client configured to use cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return req.cookies.get(name)?.value;
        },
        set(name, value, options) {
          // If the cookie is updated, update the cookies for the request and response
          req.cookies.set({
            name,
            value,
            ...options,
          });
          res.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name, options) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          });
          res.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );
  
  // Refresh session if expired
  await supabase.auth.getSession();
  
  // Check auth status for protected routes
  const { pathname } = req.nextUrl;
  const isProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/project');
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup');
  const isResetPasswordRoute = pathname.startsWith('/reset-password');
  
  const {
    data: { session },
  } = await supabase.auth.getSession();
  
  // Redirect unauthenticated users to login
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/login', req.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }
  
  // Redirect authenticated users away from auth pages
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }
  
  // Do not redirect for reset-password route, as it needs to be accessible regardless of auth status
  
  return res;
}

// Specify routes that use the middleware
export const config = {
  matcher: [
    // Protect dashboard routes
    '/dashboard/:path*',
    // Protect project routes
    '/project/:path*',
    // Auth routes
    '/login',
    '/signup',
    '/reset-password',
    // Main public pages
    '/',
  ],
}; 