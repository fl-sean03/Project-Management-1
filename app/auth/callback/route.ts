import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

// This route is called by Supabase Auth after OAuth sign-in
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') || '/projects'

  // If there's no code, something went wrong
  if (!code) {
    return NextResponse.redirect(new URL('/login?error=No auth code provided', req.url))
  }

  // Create a new response
  const response = NextResponse.redirect(new URL(next, req.url))
  
  // Create Supabase client using cookies from the request and setting them on the response
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return req.cookies.get(name)?.value
        },
        set(name, value, options) {
          // Set cookie on the response
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name, options) {
          // Remove cookie from the response
          response.cookies.set({
            name,
            value: '',
            ...options,
            maxAge: 0,
          })
        },
      },
    }
  )

  // Exchange the code for a session
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  
  if (error) {
    console.error('Error exchanging code for session:', error)
    return NextResponse.redirect(new URL('/login?error=Authentication failed: ' + error.message, req.url))
  }

  console.log('Successfully authenticated with OAuth')
  return response
} 