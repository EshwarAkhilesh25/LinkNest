'use client'

import { useState } from 'react'
import { createBookmark, updateBookmark } from '@/app/bookmarks/actions'
import type { Bookmark } from '@/lib/types/database'

interface BookmarkFormProps {
  bookmark?: Bookmark
  onSuccess?: () => void
  onCancel?: () => void
}

/**
 * BookmarkForm Component
 * 
 * A reusable form for creating and editing bookmarks.
 * Handles validation and submission via server actions.
 * 
 * Props:
 * - bookmark: Optional bookmark data for editing mode
 * - onSuccess: Callback when form submission succeeds
 * - onCancel: Callback when form is cancelled
 */
export default function BookmarkForm({ bookmark, onSuccess, onCancel }: BookmarkFormProps) {
  const [title, setTitle] = useState(bookmark?.title || '')
  const [url, setUrl] = useState(bookmark?.url || '')
  const [isPublic, setIsPublic] = useState(bookmark?.is_public || false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isEditing = !!bookmark

  async function handleSubmit(formData: FormData) {
    setError(null)
    setLoading(true)

    // Add form data
    formData.append('title', title)
    formData.append('url', url)

    if (isEditing && bookmark) {
      formData.append('id', bookmark.id)
      const result = await updateBookmark(formData)
      if (result?.error) {
        setError(result.error)
        setLoading(false)
        return
      }
    } else {
      const result = await createBookmark(formData)
      if (result?.error) {
        setError(result.error)
        setLoading(false)
        return
      }
    }

    setLoading(false)
    // Reset form if creating new bookmark
    if (!isEditing) {
      setTitle('')
      setUrl('')
      setIsPublic(false)
    }
    onSuccess?.()
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="title"
          className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Title
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          placeholder="My Awesome Bookmark"
          required
          maxLength={200}
        />
      </div>

      <div>
        <label
          htmlFor="url"
          className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          URL
        </label>
        <input
          type="url"
          id="url"
          name="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          placeholder="https://example.com"
          required
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="is_public"
          name="is_public"
          value="true"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
        />
        <label
          htmlFor="is_public"
          className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
        >
          Make this bookmark public
        </label>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : isEditing ? 'Update Bookmark' : 'Create Bookmark'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
