'use client'

import { useState, useEffect } from 'react'
import Navigation from '@/components/Navigation'
import BookmarkForm from '@/components/BookmarkForm'
import BookmarkList from '@/components/BookmarkList'
import type { Bookmark } from '@/lib/types/database'
import { createClient } from '@/lib/supabase/client'

/**
 * Dashboard Page
 * 
 * Displays the user's dashboard with bookmark management functionality.
 * Shows a form to create bookmarks and a list of existing bookmarks.
 * 
 * Features:
 * - Create new bookmarks
 * - View all bookmarks
 * - Edit existing bookmarks
 * - Delete bookmarks
 * - Toggle public/private visibility
 */
export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null)
  const [bookmarkListKey, setBookmarkListKey] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    // Check initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  function handleCreateSuccess() {
    setShowCreateForm(false)
    setBookmarkListKey(prev => prev + 1)
  }

  function handleEditSuccess() {
    setEditingBookmark(null)
    setBookmarkListKey(prev => prev + 1)
  }

  function handleBookmarkChange() {
    setBookmarkListKey(prev => prev + 1)
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navigation />
        <main className="mx-auto max-w-6xl px-6 py-12">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navigation />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          {!showCreateForm && !editingBookmark && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
            >
              + New Bookmark
            </button>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Form Section */}
          {(showCreateForm || editingBookmark) && (
            <div className="lg:col-span-1">
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
                  {editingBookmark ? 'Edit Bookmark' : 'Create Bookmark'}
                </h2>
                <BookmarkForm
                  bookmark={editingBookmark || undefined}
                  onSuccess={editingBookmark ? handleEditSuccess : handleCreateSuccess}
                  onCancel={() => {
                    setShowCreateForm(false)
                    setEditingBookmark(null)
                  }}
                />
              </div>
            </div>
          )}

          {/* Bookmarks List Section */}
          <div className={showCreateForm || editingBookmark ? 'lg:col-span-2' : 'lg:col-span-3'}>
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
                Your Bookmarks
              </h2>
              <BookmarkList
                key={bookmarkListKey}
                onEdit={(bookmark) => setEditingBookmark(bookmark)}
                onBookmarkChange={handleBookmarkChange}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
