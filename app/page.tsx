'use client'

import Link from "next/link";
import Navigation from "@/components/Navigation";
import { useRecoverySession } from "@/hooks/useRecoverySession";
import { useRouter } from "next/navigation";

export default function Home() {
  const { isRecoverySession, loading } = useRecoverySession();
  const router = useRouter();

  const handleLogout = async () => {
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navigation />
        <main className="mx-auto max-w-6xl px-6 py-12">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  if (isRecoverySession) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navigation />
        <main className="mx-auto max-w-6xl px-6 py-12">
          <div className="text-center">
            <div className="mb-8 inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30">
              <svg className="w-10 h-10 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="mb-4 text-5xl font-bold text-gray-900 dark:text-white">
              Password Reset In Progress
            </h1>
            <p className="mb-8 text-xl text-gray-600 dark:text-gray-400">
              Please reset your password to continue.
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/reset-password"
                className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 transition-colors"
              >
                Continue Reset Password
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-lg border border-gray-300 px-6 py-3 text-gray-700 hover:bg-gray-100 transition-colors dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Logout
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navigation />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="text-center">
          <h1 className="mb-4 text-5xl font-bold text-gray-900 dark:text-white">
            Welcome to LinkNest
          </h1>
          <p className="mb-8 text-xl text-gray-600 dark:text-gray-400">
            A modern platform to manage and share your links
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/signup"
              className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 transition-colors"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-gray-300 px-6 py-3 text-gray-700 hover:bg-gray-100 transition-colors dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Sign In
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
