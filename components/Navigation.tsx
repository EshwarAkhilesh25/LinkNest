'use client'

import Link from "next/link";
import { useEffect, useState } from "react";
import { logout } from "@/app/auth/actions";
import { useRecoverySession } from "@/hooks/useRecoverySession";

/**
 * Navigation Component
 * 
 * This component displays the navigation bar with auth-aware links.
 * It checks the user's authentication state and shows appropriate links.
 * 
 * Authentication Flow:
 * - Uses the client Supabase client to check session state
 * - Listens for auth state changes to update UI
 * - Shows Login/Signup when user is logged out
 * - Shows Dashboard/Logout when user is logged in
 * - Hides Dashboard/Profile during password recovery sessions
 * 
 * Session Handling:
 * - Session is automatically detected from cookies
 * - Component re-renders when auth state changes
 * - Logout button calls the logout server action
 * 
 * Static Generation:
 * - Dynamically imports Supabase client only in browser
 * - Prevents build errors when environment variables are not set
 */
export default function Navigation() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const { isRecoverySession } = useRecoverySession();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Only create Supabase client in browser environment
    if (typeof window === 'undefined') return;

    // Dynamically import to prevent static generation issues
    import('@/lib/supabase/client').then(({ createClient }) => {
      const supabase = createClient();

      // Check initial session
      supabase.auth.getUser().then(({ data: { user } }) => {
        setUser(user);
        setLoading(false);

        // Fetch user profile if logged in
        if (user) {
          supabase
            .from('profiles')
            .select('handle')
            .eq('id', user.id)
            .maybeSingle()
            .then(({ data }) => {
              setProfile(data);
            });
        }
      });

      // Listen for auth state changes
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        setUser(session?.user ?? null);
        
        if (session?.user) {
          supabase
            .from('profiles')
            .select('handle')
            .eq('id', session.user.id)
            .maybeSingle()
            .then(({ data }) => {
              setProfile(data);
            });
        } else {
          setProfile(null);
        }
      });

      return () => subscription.unsubscribe();
    });
  }, [mounted]);

  async function handleLogout() {
    await logout();
  }

  return (
    <nav className="border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white">
          LinkNest
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            Home
          </Link>
          {!mounted || loading ? (
            <span className="text-gray-600 dark:text-gray-400">Loading...</span>
          ) : user ? (
            <>
              {isRecoverySession ? (
                // Recovery session: only show logout
                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                >
                  Logout
                </button>
              ) : (
                // Normal session: show handle, dashboard, and logout
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      @{profile?.handle || 'user'}
                    </span>
                  </div>
                  <Link
                    href="/dashboard"
                    className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  >
                    Logout
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
