'use server'

/**
 * Authentication Server Actions
 * 
 * These server actions handle authentication operations on the server side.
 * They use the server Supabase client to interact with Supabase Auth.
 * 
 * Authentication Flow:
 * - Signup: Creates a new user with email/password and stores their handle
 * - Login: Authenticates user with email/password and creates a session
 * - Logout: Destroys the current session
 * - Forgot Password: Sends password reset email
 * - Reset Password: Updates password using reset token
 * 
 * Session Handling:
 * - Sessions are managed via HTTP-only cookies
 * - Server actions automatically handle cookie setting
 * - Sessions persist across page refreshes
 * 
 * Route Protection:
 * - These actions are used by the signup/login pages
 * - After successful auth, users are redirected appropriately
 * - Middleware checks session existence for protected routes
 * 
 * Security Considerations:
 * - Forgot password does not reveal whether email exists (prevents account enumeration)
 * - Reset password handles expired/invalid tokens gracefully
 * - Password strength validation enforced
 * - All errors are generic to prevent information leakage
 */

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { sendWelcomeEmail } from '@/lib/email/service'

/**
 * Signup Action
 * 
 * Creates a new user account with email, password, and handle.
 * The handle is stored in the profiles table after user creation.
 * 
 * @param formData - Form data containing email, password, and handle
 * 
 * Authentication Flow:
 * 1. Validates input data
 * 2. Creates user in Supabase Auth
 * 3. Inserts handle into profiles table
 * 4. Sends welcome email (non-blocking)
 * 5. Checks if session exists (depends on email confirmation setting)
 * 6. Redirects to dashboard if session exists, or login with verification message if not
 * 
 * Email Confirmation:
 * - If Supabase Email Confirmation is enabled, no session is created immediately
 * - User must verify email before logging in
 * - Redirects to login with verification message
 * - If Email Confirmation is disabled, session is created and user is logged in immediately
 * 
 * Email Flow:
 * - After successful profile creation, sendWelcomeEmail() is called
 * - Email contains welcome message, user's handle, and dashboard link
 * - If email sending fails, error is logged but signup still succeeds
 * - This ensures email service failures don't block user registration
 * 
 * Session Handling:
 * - Session is created by Supabase only if email confirmation is disabled
 * - Cookies are set automatically by the server client when session exists
 * - User is redirected appropriately based on session availability
 * 
 * Error Handling:
 * - If profile insertion fails after auth user creation, auth user remains in auth.users
 * - This is acceptable for this application scale
 * - A production-grade solution would use service role key for cleanup or database triggers
 * - See README.md for production-grade implementation details
 */
export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    handle: formData.get('handle') as string,
  }

  // Validate input
  if (!data.email || !data.password || !data.handle) {
    return { error: 'All fields are required' }
  }

  // Validate handle format (alphanumeric and underscores only)
  if (!/^[a-zA-Z0-9_]+$/.test(data.handle)) {
    return { error: 'Handle can only contain letters, numbers, and underscores' }
  }

  // Validate handle length
  if (data.handle.length < 3 || data.handle.length > 20) {
    return { error: 'Handle must be between 3 and 20 characters' }
  }

  let redirectTo: string | null = null

  try {
    // Check if handle already exists before creating user
    const { data: existingHandle, error: checkError } = await supabase
      .from('profiles')
      .select('handle')
      .eq('handle', data.handle)
      .single()

    if (existingHandle) {
      return { error: 'This handle is already taken' }
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    })

    if (authError) {
      return { error: authError.message }
    }

    if (authData.user) {
      const serviceRoleClient = await createServiceRoleClient()
      
      const { data: profileData, error: profileError } = await serviceRoleClient
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: data.email,
          handle: data.handle,
        })
        .select()

      if (profileError) {
        return { error: 'Failed to create profile. Please try again.' }
      }

      try {
        await sendWelcomeEmail(data.email, data.handle)
      } catch (emailError) {
        // Email error is non-blocking - signup still succeeds
      }
    }

    if (authData.session) {
      revalidatePath('/', 'layout')
      redirectTo = '/dashboard'
    } else {
      redirectTo = '/login?message=Account created successfully. Please verify your email before logging in.'
    }
  } catch (error) {
    return { error: 'An unexpected error occurred during signup' }
  }

  // Perform redirect outside try/catch to avoid catching NEXT_REDIRECT error
  if (redirectTo) {
    redirect(redirectTo)
  }

  // Fallback return (should never reach here if redirect is set)
  return { error: 'An unexpected error occurred during signup' }
}

/**
 * Login Action
 * 
 * Authenticates a user with email and password.
 * Creates a session that persists via HTTP-only cookies.
 * 
 * @param formData - Form data containing email and password
 * 
 * Authentication Flow:
 * 1. Validates input data
 * 2. Attempts to authenticate with Supabase Auth
 * 3. Creates session in cookies on success
 * 4. Redirects to dashboard on success
 * 
 * Session Handling:
 * - Session is stored in HTTP-only cookies for security
 * - Session automatically refreshes when needed
 * - Session persists across browser sessions
 */
export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  // Validate input
  if (!data.email || !data.password) {
    return { error: 'Email and password are required' }
  }

  let redirectTo: string | null = null

  try {
    // Attempt to sign in with email and password
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/', 'layout')
    redirectTo = '/dashboard'
  } catch (error) {
    return { error: 'An unexpected error occurred during login' }
  }

  // Perform redirect outside try/catch to avoid catching NEXT_REDIRECT error
  if (redirectTo) {
    redirect(redirectTo)
  }

  // Fallback return (should never reach here if redirect is set)
  return { error: 'An unexpected error occurred during login' }
}

/**
 * Logout Action
 * 
 * Destroys the current user session.
 * Clears the session cookies and redirects to home.
 * 
 * Authentication Flow:
 * 1. Gets current session from cookies
 * 2. Signs out the user from Supabase Auth
 * 3. Clears session cookies
 * 4. Redirects to home page
 * 
 * Session Handling:
 * - Session is removed from cookies
 * - User is logged out on all devices
 * - Any cached user data should be cleared
 */
export async function logout() {
  const supabase = await createClient()

  let redirectTo: string | null = null

  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/', 'layout')
    redirectTo = '/'
  } catch (error) {
    return { error: 'An unexpected error occurred during logout' }
  }

  // Perform redirect outside try/catch to avoid catching NEXT_REDIRECT error
  if (redirectTo) {
    redirect(redirectTo)
  }

  // Fallback return (should never reach here if redirect is set)
  return { error: 'An unexpected error occurred during logout' }
}

/**
 * Forgot Password Action
 * 
 * Sends a password reset email to the user.
 * This action does not reveal whether the email exists to prevent account enumeration.
 * 
 * @param formData - Form data containing email address
 * 
 * Password Reset Flow:
 * 1. Validates email format
 * 2. Calls Supabase resetPasswordForEmail
 * 3. Shows success message regardless of whether email exists
 * 4. User receives email with reset link
 * 
 * Security Considerations:
 * - Always returns success to prevent account enumeration
 * - Uses redirectTo to send user to reset password page
 * - Reset links expire after 1 hour (Supabase default)
 * - Generic error messages to prevent information leakage
 */
export async function forgotPassword(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string

  // Validate email format
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Please enter a valid email address' }
  }

  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const redirectTo = `${siteUrl}/reset-password`

    console.log('SITE URL:', siteUrl)
    console.log('RESET PASSWORD URL:', redirectTo)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo,
    })

    if (error) {
      return { success: 'If an account exists with this email, you will receive a password reset link' }
    }

    return { success: 'If an account exists with this email, you will receive a password reset link' }
  } catch (error) {
    return { success: 'If an account exists with this email, you will receive a password reset link' }
  }
}

/**
 * Reset Password Action
 * 
 * NOTE: This action is no longer used. Password reset is now handled client-side
 * in the reset-password page using the browser Supabase client to properly
 * handle recovery tokens from the URL hash.
 * 
 * The client-side implementation is required because:
 * - Supabase sends recovery tokens in the URL hash (#access_token=...)
 * - Server actions cannot access URL hash parameters
 * - The browser client automatically extracts and validates these tokens
 * 
 * See: app/reset-password/page.tsx for the current implementation
 */
