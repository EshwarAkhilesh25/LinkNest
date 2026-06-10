/**
 * Database Query Helpers for LinkNest
 * 
 * These helper functions provide type-safe access to common database operations.
 * They use the Supabase client and enforce RLS policies at the database level.
 * 
 * Security Note:
 * All queries are protected by Row Level Security (RLS) policies in the database.
 * This ensures users can only access their own data, even if client-side code is bypassed.
 */

import { createClient } from '@/lib/supabase/server'
import type { Profile, Bookmark } from '@/lib/types/database'

/**
 * Get a profile by handle
 * 
 * Retrieves a user's profile by their unique handle.
 * This is used for public profile pages.
 * 
 * @param handle - The unique handle of the user
 * @returns The profile or null if not found
 * 
 * Security Note: Uses the profiles_public view which only exposes
 * handle and created_at, protecting email addresses from public view.
 */
export async function getProfileByHandle(handle: string): Promise<Profile | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('profiles_public')
    .select('*')
    .eq('handle', handle)
    .single()
  
  if (error) {
    return null
  }
  
  return data
}

/**
 * Get bookmarks by user ID
 * 
 * Retrieves all bookmarks for a specific user (including private ones).
 * This is used when a user views their own dashboard.
 * 
 * @param userId - The UUID of the user
 * @returns Array of bookmarks ordered by creation date (newest first)
 * 
 * RLS Policy: "Users can view own bookmarks"
 * - Only returns bookmarks where user_id matches auth.uid()
 * - Users cannot see other users' bookmarks
 * - Includes both public and private bookmarks for the owner
 */
export async function getBookmarksByUser(userId: string): Promise<Bookmark[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('bookmarks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (error) {
    return []
  }
  
  return data || []
}

/**
 * Get public bookmarks by handle
 * 
 * Retrieves only public bookmarks for a user's profile.
 * This is used when viewing a public profile page.
 * 
 * @param handle - The unique handle of the user
 * @returns Array of public bookmarks ordered by creation date (newest first)
 * 
 * RLS Policy: "Public can view public bookmarks"
 * - Only returns bookmarks where is_public = true
 * - Unauthenticated users can view these bookmarks
 * - Private bookmarks are never returned
 */
export async function getPublicBookmarksByHandle(handle: string): Promise<Bookmark[]> {
  const supabase = await createClient()
  
  // First get the user ID from the handle
  const profile = await getProfileByHandle(handle)
  if (!profile) {
    return []
  }
  
  // Then get public bookmarks for that user
  const { data, error } = await supabase
    .from('bookmarks')
    .select('*')
    .eq('user_id', profile.id)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
  
  if (error) {
    return []
  }
  
  return data || []
}

/**
 * Check if a handle is available
 * 
 * Checks if a handle is already taken by another user.
 * This is used during signup to prevent duplicate handles.
 * 
 * @param handle - The handle to check
 * @returns true if the handle is available, false if taken
 * 
 * Database Constraint: handle is unique
 * - The database has a unique constraint on the handle column
 * - This function provides a pre-check for better UX
 */
export async function isHandleAvailable(handle: string): Promise<boolean> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('handle')
    .eq('handle', handle)
    .single()
  
  if (error && error.code !== 'PGRST116') {
    return false
  }
  
  // If data exists, handle is taken
  return !data
}

/**
 * Create a new bookmark
 * 
 * Creates a new bookmark for the authenticated user.
 * 
 * @param bookmark - The bookmark data to insert
 * @returns The created bookmark or null if failed
 * 
 * RLS Policy: "Users can create own bookmarks"
 * - Ensures user_id matches auth.uid()
 * - Prevents users from creating bookmarks for others
 */
export async function createBookmark(bookmark: {
  user_id: string
  title: string
  url: string
  is_public?: boolean
}): Promise<Bookmark | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('bookmarks')
    .insert(bookmark)
    .select()
    .single()
  
  if (error) {
    return null
  }
  
  return data
}

/**
 * Update a bookmark
 * 
 * Updates an existing bookmark.
 * 
 * @param id - The bookmark ID
 * @param updates - The fields to update
 * @returns The updated bookmark or null if failed
 * 
 * RLS Policy: "Users can update own bookmarks"
 * - Only allows updating bookmarks where user_id = auth.uid()
 * - Users cannot modify other users' bookmarks
 */
export async function updateBookmark(
  id: string,
  updates: Partial<Pick<Bookmark, 'title' | 'url' | 'is_public'>>
): Promise<Bookmark | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('bookmarks')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    return null
  }
  
  return data
}

/**
 * Delete a bookmark
 * 
 * Deletes a bookmark.
 * 
 * @param id - The bookmark ID
 * @returns true if successful, false otherwise
 * 
 * RLS Policy: "Users can delete own bookmarks"
 * - Only allows deleting bookmarks where user_id = auth.uid()
 * - Users cannot delete other users' bookmarks
 */
export async function deleteBookmark(id: string): Promise<boolean> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('bookmarks')
    .delete()
    .eq('id', id)
  
  if (error) {
    return false
  }
  
  return true
}
