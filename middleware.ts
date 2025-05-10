import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  // Check auth status for protected routes
  const { pathname } = req.nextUrl;
  
  // Skip authentication check for callback route
  // This will be handled by the callback route handler 
  const isCallback = pathname.startsWith('/auth/callback');
  if (isCallback) {
    // Let the callback route handle the authentication
    return res;
  }
  
  // Create a Supabase client configured to use cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
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
        remove(name: string, options: CookieOptions) {
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
  
  const isProtectedRoute = pathname.startsWith('/dashboard') || 
                           pathname.startsWith('/project') || 
                           pathname === '/projects';
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
    return NextResponse.redirect(new URL('/projects', req.url));
  }
  
  // Do not redirect for reset-password route, as it needs to be accessible regardless of auth status
  
  // Only proceed with project-specific access checks for individual project pages
  // This avoids running the project membership check for /projects, /dashboard, etc.
  if (!pathname.match(/^\/project\/[^\/]+/)) {
    return res;
  }

  // Get the project ID from the URL
  const projectId = pathname.split('/')[2];
  if (!projectId) {
    return res;
  }

  // We already checked if session exists above, but let's double check
  if (!session) {
    const redirectUrl = new URL('/login', req.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Check if the user is a member of the project
  const { data: projectMember, error } = await supabase
    .from('project_members')
    .select('*')
    .eq('project_id', projectId)
    .eq('user_id', session.user.id)
    .single();

  // If user is not a member of the project, redirect to projects page
  if (error || !projectMember) {
    // Check if the user is the owner of the project
    const { data: project } = await supabase
      .from('projects')
      .select('owner_id')
      .eq('id', projectId)
      .single();
    
    // Allow access if the user is the project owner
    if (project && project.owner_id === session.user.id) {
      return res;
    }
    
    // Otherwise, redirect to the projects page with an error message
    const url = new URL('/projects', req.url);
    url.searchParams.set('error', 'You do not have access to this project');
    return NextResponse.redirect(url);
  }

  return res;
}

// Specify routes that use the middleware
export const config = {
  matcher: [
    // Protect dashboard routes
    '/dashboard/:path*',
    // Protect project routes
    '/project/:path*',
    // Protect the projects list page
    '/projects',
    // Auth routes
    '/login',
    '/signup',
    '/reset-password',
    // Auth callback route
    '/auth/callback',
    // Main public pages
    '/',
  ],
}; 