/**
 * Email Service
 * 
 * A reusable email service using Resend API for sending transactional emails.
 * 
 * Email Flow:
 * 1. Server action calls sendWelcomeEmail() after successful signup
 * 2. Email service constructs email with user's handle and dashboard link
 * 3. Email is sent via Resend API
 * 4. If email sending fails, error is logged but signup still succeeds
 * 
 * This ensures that email failures don't block user registration.
 */

import { Resend } from 'resend'

// Initialize Resend client with API key from environment
const resend = new Resend(process.env.RESEND_API_KEY || '')

/**
 * Send Welcome Email
 * 
 * Sends a welcome email to a newly registered user.
 * 
 * @param email - User's email address
 * @param handle - User's unique handle
 * @returns Success or error message
 * 
 * Email Contents:
 * - Welcome message
 * - User's handle
 * - Link to dashboard
 * 
 * Error Handling:
 * - If RESEND_API_KEY is not set, returns error but doesn't throw
 * - If email sending fails, logs error but doesn't throw
 * - This ensures signup succeeds even if email fails
 */
export async function sendWelcomeEmail(email: string, handle: string) {
  if (!process.env.RESEND_API_KEY) {
    return { error: 'Email service not configured' }
  }

  try {
    const dashboardUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard`

    const { data, error } = await resend.emails.send({
      from: 'LinkNest <onboarding@resend.dev>',
      to: [email],
      subject: 'Welcome to LinkNest!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Welcome to LinkNest!</h1>
          <p style="color: #374151; font-size: 16px;">
            Hi there! Your account has been successfully created.
          </p>
          <p style="color: #374151; font-size: 16px;">
            Your handle: <strong>@${handle}</strong>
          </p>
          <p style="color: #374151; font-size: 16px;">
            You can now start creating and managing your bookmarks.
          </p>
          <a href="${dashboardUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
            Go to Dashboard
          </a>
          <p style="color: #6b7280; font-size: 14px;">
            If you didn't create an account, you can safely ignore this email.
          </p>
        </div>
      `,
    })

    if (error) {
      return { error: error.message }
    }

    return { success: 'Welcome email sent successfully' }
  } catch (error) {
    return { error: 'Failed to send welcome email' }
  }
}
