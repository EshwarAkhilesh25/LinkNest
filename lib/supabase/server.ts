/**
 * Supabase Server Configuration
 * 
 * This file creates a Supabase client for use in server components and server actions.
 * It uses the @supabase/ssr package to handle cookie-based session management on the server.
 * 
 * Authentication Flow:
 * - The server reads session data from cookies
 * - It validates the session on each request
 * - It provides secure server-side access to Supabase
 * 
 * Session Handling:
 * - Sessions are validated server-side on each request
 * - The server can access user data securely without exposing credentials
 * - Used for protected routes and server actions
 * 
 * Route Protection:
 * - This client is used in middleware to check authentication
 * - It's used in server components to access user data
 * - It ensures only authenticated users can access protected resources
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Creates a Supabase client for use in server components.
 * This function reads cookies to get the current session.
 * 
 * @returns Supabase client instance configured with server cookies
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
