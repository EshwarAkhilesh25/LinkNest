import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Create a Supabase client with service role key for admin operations.
 * 
 * This client bypasses Row Level Security (RLS) policies and should only be used
 * for server-side operations that require admin privileges, such as:
 * - Creating profiles during signup (when auth.uid() is not yet available)
 * - Repairing orphaned data
 * - Bulk operations that need to bypass RLS
 * 
 * SECURITY WARNING:
 * - Never expose this client to the browser
 * - Never use this client for user-specific data operations
 * - Only use in server actions or server components
 * - The service role key must be kept secret
 */
export async function createServiceRoleClient() {
  const cookieStore = await cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is missing')
  }

  if (!supabaseServiceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing')
  }

  return createServerClient(
    supabaseUrl,
    supabaseServiceRoleKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )
}
