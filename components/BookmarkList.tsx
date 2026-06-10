'use client'

import { useEffect, useState } from 'react'
import { getBookmarks } from '@/app/bookmarks/actions'
import type { Bookmark } from '@/lib/types/database'
import BookmarkItem from './BookmarkItem'

interface BookmarkListProps {
  onEdit?: (bookmark: Bookmark) => void
  onBookmarkChange?: () => void
}

/**
 * BookmarkList Component
 * 
 * Displays a list of bookmarks for the authenticated user.
 * Fetches bookmarks from the database using server actions.
 * 
 * Props:
 * - onEdit: Callback when edit button is clicked on a bookmark
 * - onBookmarkChange: Callback when a bookmark is deleted
 */
export default function BookmarkList({ onEdit, onBookmarkChange }: BookmarkListProps) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchBookmarks() {
    setLoading(true)
    setError(null)
    
    try {
      const result = await getBookmarks()
      
      if (!result) {
        setError('No response from server')
        return
      }
      
      if (result.error) {
        setError(result.error)
      } else {
        setBookmarks(result.bookmarks || [])
      }
    } catch (err) {
      setError('Failed to load bookmarks')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookmarks()
  }, [onBookmarkChange])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
        {error}
      </div>
    )
  }

  if (bookmarks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
        <svg className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
        <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
          No bookmarks yet
        </h3>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Create your first bookmark to get started!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {bookmarks.map((bookmark) => (
        <BookmarkItem
          key={bookmark.id}
          bookmark={bookmark}
          onEdit={onEdit}
          onDelete={onBookmarkChange}
        />
      ))}
    </div>
  )
}
