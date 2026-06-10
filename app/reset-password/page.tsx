'use client'

import Link from "next/link";
import Navigation from "@/components/Navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasRecoveryToken, setHasRecoveryToken] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setHasRecoveryToken(true);
        setVerifying(false);
      }
    });
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setHasRecoveryToken(true);
        setVerifying(false);
      } else {
        setTimeout(() => {
          supabase.auth.getSession().then(({ data: { session: session2 } }) => {
            if (session2) {
              setHasRecoveryToken(true);
              setVerifying(false);
            } else {
              setError('Invalid or expired password reset link. Please request a new one.');
              setVerifying(false);
            }
          });
        }, 500);
      }
    });
    
    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        if (error.message.includes('New password should be different from the old password')) {
          setError('Your new password must be different from your current password.');
        } else if (error.message.includes('Password should be at least')) {
          setError('Password must be at least 8 characters long.');
        } else if (error.message.includes('Invalid recovery token') || error.message.includes('expired')) {
          setError('Password reset link is invalid or expired. Please request a new reset link.');
        } else {
          setError('Unable to reset password. Please try again or request a new reset link.');
        }
        
        setLoading(false);
        return;
      }

      await supabase.auth.signOut();
      router.push('/login?message=Password reset successfully. Please log in with your new password.');
    } catch (err) {
      setError('Unable to reset password. Please try again or request a new reset link.');
      setLoading(false);
    }
  }

  if (verifying) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navigation />
        <main className="mx-auto max-w-md px-6 py-12">
          <div className="text-center">
            <div className="mb-4 text-2xl">⏳</div>
            <p className="text-gray-600 dark:text-gray-400">Verifying reset link...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navigation />
      <main className="mx-auto max-w-md px-6 py-12">
        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h1 className="mb-6 text-3xl font-bold text-gray-900 dark:text-white">
            Reset Password
          </h1>
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            Enter your new password below.
          </p>
          
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
              {error}
            </div>
          )}
          
          {hasRecoveryToken && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  New Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  required
                  minLength={8}
                  disabled={loading}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="••••••••"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Must be at least 8 characters long
                </p>
              </div>
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  required
                  minLength={8}
                  disabled={loading}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}
          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Remember your password?{" "}
            <Link href="/login" className="text-blue-600 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
