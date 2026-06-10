'use server'

/**
 * Bookmark Server Actions
 * 
 * These server actions handle bookmark CRUD operations on the server side.
 * They use the server Supabase client and respect RLS policies.
 * 
 * Security:
 * - All actions use the authenticated user's session
 * - User IDs are obtained from auth.uid(), not from client input
 * - RLS policies enforce ownership at the database level
 * - No service-role keys are used
 */

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { BookmarkInsert, BookmarkUpdate, Bookmark } from '@/lib/types/database'

/**
 * Get Bookmarks Action
 * 
 * Fetches all bookmarks for the authenticated user.
 * 
 * @returns Array of bookmarks or error message
 * 
 * Security:
 * - User ID is obtained from auth.uid()
 * - RLS policy "Users can view own bookmarks" ensures only user's bookmarks are returned
 */
export async function getBookmarks() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { error: 'You must be logged in to view bookmarks', bookmarks: [] }
    }

    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        return { error: error.message, bookmarks: [] }
      }

      return { bookmarks: data || [] }
    } catch (error) {
      return { error: 'An unexpected error occurred while fetching bookmarks', bookmarks: [] }
    }
  } catch (error) {
    return { error: 'Failed to connect to database', bookmarks: [] }
  }
}

/**
 * Create Bookmark Action
 * 
 * Creates a new bookmark for the authenticated user.
 * 
 * @param formData - Form data containing title, url, and is_public
 * @returns Success or error message
 * 
 * Security:
 * - User ID is obtained from auth.uid(), not from form data
 * - RLS policy "Users can create own bookmarks" ensures user_id matches auth.uid()
 * - Prevents users from creating bookmarks for others
 */
export async function createBookmark(formData: FormData) {
  const supabase = await createClient()

  // Get the authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return { error: 'You must be logged in to create a bookmark' }
  }

  const data = {
    title: formData.get('title') as string,
    url: formData.get('url') as string,
    is_public: formData.get('is_public') === 'true',
  }

  // Validate input
  if (!data.title || !data.url) {
    return { error: 'Title and URL are required' }
  }

  // Validate URL format (basic check)
  if (!data.url.startsWith('http://') && !data.url.startsWith('https://')) {
    return { error: 'URL must start with http:// or https://' }
  }

  // Validate title length
  if (data.title.length < 1 || data.title.length > 200) {
    return { error: 'Title must be between 1 and 200 characters' }
  }

  try {
    // Create bookmark with authenticated user's ID
    const bookmarkData: BookmarkInsert = {
      user_id: user.id,
      title: data.title,
      url: data.url,
      is_public: data.is_public,
    }

    const { error } = await supabase
      .from('bookmarks')
      .insert(bookmarkData)

    if (error) {
      return { error: error.message }
    }

    // Revalidate the dashboard path to update the bookmark list
    revalidatePath('/dashboard')
    
    return { success: 'Bookmark created successfully' }
  } catch (error) {
    return { error: 'An unexpected error occurred while creating the bookmark' }
  }
}

/**
 * Update Bookmark Action
 * 
 * Updates an existing bookmark.
 * 
 * @param formData - Form data containing id, title, url, and is_public
 * @returns Success or error message
 * 
 * Security:
 * - Gets authenticated user from auth.uid()
 * - Explicitly checks user_id in query for defense in depth
 * - RLS policy "Users can update own bookmarks" ensures only the owner can update
 * - Prevents users from modifying other users' bookmarks
 */
export async function updateBookmark(formData: FormData) {
  const supabase = await createClient()

  // Get the authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return { error: 'You must be logged in to update a bookmark' }
  }

  const data = {
    id: formData.get('id') as string,
    title: formData.get('title') as string,
    url: formData.get('url') as string,
    is_public: formData.get('is_public') === 'true',
  }

  // Validate input
  if (!data.id || !data.title || !data.url) {
    return { error: 'ID, title, and URL are required' }
  }

  // Validate URL format (basic check)
  if (!data.url.startsWith('http://') && !data.url.startsWith('https://')) {
    return { error: 'URL must start with http:// or https://' }
  }

  // Validate title length
  if (data.title.length < 1 || data.title.length > 200) {
    return { error: 'Title must be between 1 and 200 characters' }
  }

  try {
    const updateData: BookmarkUpdate = {
      title: data.title,
      url: data.url,
      is_public: data.is_public,
    }

    const { error } = await supabase
      .from('bookmarks')
      .update(updateData)
      .eq('id', data.id)
      .eq('user_id', user.id)

    if (error) {
      return { error: error.message }
    }

    // Revalidate the dashboard path to update the bookmark list
    revalidatePath('/dashboard')
    
    return { success: 'Bookmark updated successfully' }
  } catch (error) {
    return { error: 'An unexpected error occurred while updating the bookmark' }
  }
}

/**
 * Delete Bookmark Action
 * 
 * Deletes an existing bookmark.
 * 
 * @param formData - Form data containing the bookmark id
 * @returns Success or error message
 * 
 * Security:
 * - Gets authenticated user from auth.uid()
 * - Explicitly checks user_id in query for defense in depth
 * - RLS policy "Users can delete own bookmarks" ensures only the owner can delete
 * - Prevents users from deleting other users' bookmarks
 */
export async function deleteBookmark(formData: FormData) {
  const supabase = await createClient()

  // Get the authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return { error: 'You must be logged in to delete a bookmark' }
  }

  const id = formData.get('id') as string

  // Validate input
  if (!id) {
    return { error: 'Bookmark ID is required' }
  }

  try {
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      return { error: error.message }
    }

    // Revalidate the dashboard path to update the bookmark list
    revalidatePath('/dashboard')
    
    return { success: 'Bookmark deleted successfully' }
  } catch (error) {
    return { error: 'An unexpected error occurred while deleting the bookmark' }
  }
}

/**
 * Toggle Bookmark Visibility Action
 * 
 * Toggles the is_public status of a bookmark.
 * 
 * @param formData - Form data containing the bookmark id
 * @returns Success or error message
 * 
 * Security:
 * - Gets authenticated user from auth.uid()
 * - Explicitly checks user_id in query for defense in depth
 * - RLS policy "Users can update own bookmarks" ensures only the owner can toggle
 */
export async function toggleBookmarkVisibility(formData: FormData) {
  const supabase = await createClient()

  // Get the authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return { error: 'You must be logged in to update bookmark visibility' }
  }

  const id = formData.get('id') as string

  // Validate input
  if (!id) {
    return { error: 'Bookmark ID is required' }
  }

  try {
    // First get the current bookmark to determine the new visibility
    const { data: bookmark, error: fetchError } = await supabase
      .from('bookmarks')
      .select('is_public')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !bookmark) {
      return { error: 'Bookmark not found' }
    }

    // Toggle the visibility
    const { error } = await supabase
      .from('bookmarks')
      .update({ is_public: !bookmark.is_public })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      return { error: error.message }
    }

    // Revalidate the dashboard path to update the bookmark list
    revalidatePath('/dashboard')
    
    return { success: 'Bookmark visibility updated successfully' }
  } catch (error) {
    return { error: 'An unexpected error occurred while updating bookmark visibility' }
  }
}
