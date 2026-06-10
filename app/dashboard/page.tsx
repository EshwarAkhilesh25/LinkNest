'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import BookmarkForm from '@/components/BookmarkForm'
import BookmarkList from '@/components/BookmarkList'
import type { Bookmark } from '@/lib/types/database'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Skeleton from '@/components/ui/Skeleton'
import Toast from '@/components/ui/Toast'

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
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null)
  const [bookmarkListKey, setBookmarkListKey] = useState(0)
  const [stats, setStats] = useState({ total: 0, public: 0, recent: 0 })
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<{ handle: string } | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
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

    const fetchProfile = async () => {
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('handle')
          .eq('id', user.id)
          .single()

        if (profileData) {
          setProfile(profileData)
        }
      } catch (error) {
        // Error fetching profile
      } finally {
        setProfileLoading(false)
      }
    }

    fetchStats()
    fetchProfile()
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

  function handleCopyProfileLink() {
    if (!profile?.handle) return
    const profileUrl = `${window.location.origin}/${profile.handle}`
    navigator.clipboard.writeText(profileUrl)
    setToast({ message: 'Profile link copied successfully', type: 'success' })
  }

  function handleViewProfile() {
    if (!profile?.handle) return
    router.push(`/${profile.handle}`)
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Navigation />
        <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12">
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
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-6 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              Dashboard
            </h1>
            {!showCreateForm && !editingBookmark && (
              <Button onClick={() => setShowCreateForm(true)} className="w-full sm:w-auto">
                + New Bookmark
              </Button>
            )}
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {loading ? (
              <>
                <Card className="p-4 sm:p-6">
                  <Skeleton className="h-16 sm:h-20" />
                </Card>
                <Card className="p-4 sm:p-6">
                  <Skeleton className="h-16 sm:h-20" />
                </Card>
                <Card className="p-4 sm:p-6">
                  <Skeleton className="h-16 sm:h-20" />
                </Card>
              </>
            ) : (
              <>
                <Card className="p-4 sm:p-6">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="p-2 sm:p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Bookmarks</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4 sm:p-6">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="p-2 sm:p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Public Links</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.public}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4 sm:p-6">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="p-2 sm:p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Recently Added</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.recent}</p>
                    </div>
                  </div>
                </Card>
              </>
            )}
          </div>

          {/* Public Profile Card */}
          <div className="mb-6 sm:mb-8">
            {profileLoading ? (
              <Card className="p-4 sm:p-6">
                <Skeleton className="h-20 sm:h-24" />
              </Card>
            ) : profile ? (
              <Card className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      Public Profile
                    </h2>
                    <div className="space-y-1 sm:space-y-2">
                      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                        <span className="font-medium">@{profile.handle}</span>
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500 break-all">
                        {window.location.origin}/{profile.handle}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        {stats.public} public bookmark{stats.public !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <Button
                      onClick={handleViewProfile}
                      variant="outline"
                      className="w-full sm:w-auto"
                    >
                      View Profile
                    </Button>
                    <Button
                      onClick={handleCopyProfileLink}
                      className="w-full sm:w-auto"
                    >
                      Copy Link
                    </Button>
                  </div>
                </div>
              </Card>
            ) : null}
          </div>

          <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
            {/* Form Section */}
            {(showCreateForm || editingBookmark) && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="lg:col-span-1"
              >
                <Card className="p-4 sm:p-6">
                  <h2 className="mb-3 sm:mb-4 text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
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
              <Card className="p-4 sm:p-6">
                <h2 className="mb-3 sm:mb-4 text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
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
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </main>
    </div>
  )
}
