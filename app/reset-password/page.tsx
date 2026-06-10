'use client'

import Link from "next/link";
import Navigation from "@/components/Navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

export default function ResetPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasRecoveryToken, setHasRecoveryToken] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    
    // DEBUG: Log URL search params
    console.log('[RESET-PASSWORD] Current URL:', window.location.href);
    console.log('[RESET-PASSWORD] Search params:', window.location.search);
    console.log('[RESET-PASSWORD] Hash:', window.location.hash);
    
    // Check for code parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    console.log('[RESET-PASSWORD] Code parameter:', code ? 'FOUND' : 'NOT FOUND');
    
    if (code) {
      console.log('[RESET-PASSWORD] Attempting to exchange code for session...');
      supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
        console.log('[RESET-PASSWORD] Exchange result:', { data, error });
        if (error) {
          console.error('[RESET-PASSWORD] Code exchange failed:', error);
          setError('Invalid or expired password reset link. Please request a new one.');
          setVerifying(false);
        } else if (data.session) {
          console.log('[RESET-PASSWORD] Session created successfully');
          setHasRecoveryToken(true);
          setVerifying(false);
        }
      });
    }
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[RESET-PASSWORD] Auth state change:', event, session ? 'SESSION_EXISTS' : 'NO_SESSION');
      if (event === 'PASSWORD_RECOVERY') {
        console.log('[RESET-PASSWORD] PASSWORD_RECOVERY event detected');
        setHasRecoveryToken(true);
        setVerifying(false);
      }
    });
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[RESET-PASSWORD] Initial session check:', session ? 'SESSION_EXISTS' : 'NO_SESSION');
      if (session) {
        setHasRecoveryToken(true);
        setVerifying(false);
      } else if (!code) {
        // Only show error if there's no code parameter
        setTimeout(() => {
          supabase.auth.getSession().then(({ data: { session: session2 } }) => {
            console.log('[RESET-PASSWORD] Retry session check:', session2 ? 'SESSION_EXISTS' : 'NO_SESSION');
            if (session2) {
              setHasRecoveryToken(true);
              setVerifying(false);
            } else {
              console.error('[RESET-PASSWORD] No session found and no code parameter');
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Navigation />
        <main className="mx-auto max-w-md px-4 sm:px-6 py-8 sm:py-12">
          <div className="text-center">
            <div className="mb-4 text-2xl">⏳</div>
            <p className="text-gray-600 dark:text-gray-400">Verifying reset link...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navigation />
      <main className="mx-auto max-w-md px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="p-6 sm:p-8">
            <h1 className="mb-4 sm:mb-6 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Reset Password
            </h1>
            <p className="mb-4 sm:mb-6 text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Enter your new password below.
            </p>
            
            {error && (
              <Alert type="error" className="mb-4">
                {error}
              </Alert>
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
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      required
                      minLength={8}
                      disabled={loading}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 pr-10 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
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
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      required
                      minLength={8}
                      disabled={loading}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 pr-10 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                      {showConfirmPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <Button type="submit" loading={loading} disabled={loading} className="w-full">
                  Reset Password
                </Button>
              </form>
            )}
            <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
              Remember your password?{" "}
              <Link href="/login" className="text-blue-600 hover:underline font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
