'use client'

import { useState, useEffect } from 'react'
import Navigation from '@/components/Navigation'
import BookmarkForm from '@/components/BookmarkForm'
import BookmarkList from '@/components/BookmarkList'
import type { Bookmark } from '@/lib/types/database'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Skeleton from '@/components/ui/Skeleton'

/**
 * Dashboard Page
 * 
 * Displays the user's dashboard with bookmark management functionality.
 * Shows statistics, a form to create bookmarks, and a list of existing bookmarks.
 * 
 * Features:
 * - Statistics cards (Total Bookmarks, Public Links, Recently Added)
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
  const [stats, setStats] = useState({ total: 0, public: 0, recent: 0 })
  const [loading, setLoading] = useState(true)
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

  useEffect(() => {
    if (!user) return

    const fetchStats = async () => {
      try {
        const { data: bookmarks } = await supabase
          .from('bookmarks')
          .select('*')
          .eq('user_id', user.id)

        if (bookmarks) {
          const total = bookmarks.length
          const publicCount = bookmarks.filter((b: Bookmark) => b.is_public).length
          const recent = bookmarks.filter((b: Bookmark) => {
            const createdAt = new Date(b.created_at)
            const weekAgo = new Date()
            weekAgo.setDate(weekAgo.getDate() - 7)
            return createdAt > weekAgo
          }).length

          setStats({ total, public: publicCount, recent })
        }
      } catch (error) {
        // Error fetching stats
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, bookmarkListKey])

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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navigation />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Dashboard
            </h1>
            {!showCreateForm && !editingBookmark && (
              <Button onClick={() => setShowCreateForm(true)}>
                + New Bookmark
              </Button>
            )}
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {loading ? (
              <>
                <Card className="p-6">
                  <Skeleton className="h-20" />
                </Card>
                <Card className="p-6">
                  <Skeleton className="h-20" />
                </Card>
                <Card className="p-6">
                  <Skeleton className="h-20" />
                </Card>
              </>
            ) : (
              <>
                <Card className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Bookmarks</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
                      <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Public Links</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.public}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                      <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Recently Added</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.recent}</p>
                    </div>
                  </div>
                </Card>
              </>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Form Section */}
            {(showCreateForm || editingBookmark) && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="lg:col-span-1"
              >
                <Card className="p-6">
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
                </Card>
              </motion.div>
            )}

            {/* Bookmarks List Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className={showCreateForm || editingBookmark ? 'lg:col-span-2' : 'lg:col-span-3'}
            >
              <Card className="p-6">
                <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
                  Your Bookmarks
                </h2>
                <BookmarkList
                  key={bookmarkListKey}
                  onEdit={(bookmark) => setEditingBookmark(bookmark)}
                  onBookmarkChange={handleBookmarkChange}
                />
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
