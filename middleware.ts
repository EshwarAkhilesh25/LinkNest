/**
 * Middleware for Route Protection
 * 
 * This middleware protects routes based on authentication status.
 * It runs before each request to check if the user is authenticated.
 * 
 * Authentication Flow:
 * - Checks for a valid session in cookies
 * - Redirects unauthenticated users from protected routes
 * - Allows authenticated users to access protected routes
 * 
 * Session Handling:
 * - Reads session from HTTP-only cookies
 * - Validates session with Supabase
 * - Redirects to login if session is invalid
 * 
 * Route Protection:
 * - /dashboard: Protected - requires authentication
 * - /login, /signup: Public - accessible to all (but redirects authenticated users to dashboard)
 * - /forgot-password, /reset-password: Public - accessible to all (for password reset flow)
 * - /: Public - accessible to all
 * - /[handle]: Public - accessible to all
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  if (path.startsWith('/dashboard') || path.startsWith('/login') || path.startsWith('/signup')) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      if (path.startsWith('/dashboard')) {
        const redirectUrl = new URL('/login', request.url)
        redirectUrl.searchParams.set('error', 'missing_env')
        return NextResponse.redirect(redirectUrl)
      }
      return NextResponse.next()
    }

    const response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value)
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data: { session } } = await supabase.auth.getSession()
    
    let isRecoverySession = false
    if (session?.access_token) {
      try {
        const tokenParts = session.access_token.split('.')
        if (tokenParts.length === 3) {
          const base64Url = tokenParts[1]
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
          const padding = '='.repeat((4 - base64.length % 4) % 4)
          const decoded = Buffer.from(base64 + padding, 'base64').toString()
          const payload = JSON.parse(decoded)
          
          if (payload.amr && payload.amr[0] && payload.amr[0].method === 'recovery') {
            isRecoverySession = true
          }
        }
      } catch (e) {
        // JWT decoding failed - assume not a recovery session
      }
    }

    if (isRecoverySession) {
      const isResetPasswordPage = path.startsWith('/reset-password')
      const isLogoutAction = path.startsWith('/auth/logout')
      
      if (!isResetPasswordPage && !isLogoutAction) {
        const redirectUrl = new URL('/reset-password', request.url)
        return NextResponse.redirect(redirectUrl)
      }
    }

    if (path.startsWith('/dashboard') && !user) {
      const redirectUrl = new URL('/login', request.url)
      return NextResponse.redirect(redirectUrl)
    }

    if ((path.startsWith('/login') || path.startsWith('/signup')) && user) {
      const redirectUrl = new URL('/dashboard', request.url)
      return NextResponse.redirect(redirectUrl)
    }

    return response
  }

  return NextResponse.next()
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
