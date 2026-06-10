/**
 * Supabase Client Configuration
 * 
 * This file creates a Supabase client for use in client components (browser).
 * It uses the @supabase/ssr package to handle cookie-based session management
 * which is essential for Next.js App Router.
 * 
 * Authentication Flow:
 * - The client reads session data from cookies
 * - It automatically handles session refresh
 * - It provides methods for signup, login, and logout
 * 
 * Session Handling:
 * - Sessions are stored in HTTP-only cookies for security
 * - The client automatically syncs with the server session
 * - Session state is reactive - components re-render when auth state changes
 */

import { createBrowserClient } from '@supabase/ssr'

/**
 * Creates a Supabase client for use in client components.
 * This function should be called in Client Components only.
 * 
 * @returns Supabase client instance configured with browser cookies
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
