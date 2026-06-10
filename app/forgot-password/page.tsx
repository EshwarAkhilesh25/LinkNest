'use client'

import Link from "next/link";
import Navigation from "@/components/Navigation";
import { forgotPassword } from "@/app/auth/actions";
import { useState } from "react";
import { motion } from "framer-motion";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(null);
    setLoading(true);

    const result = await forgotPassword(formData);
    
    setLoading(false);
    
    if (result?.error) {
      setError(result.error);
    } else if (result?.success) {
      setSuccess(result.success);
    }
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
          <Card className="p-8">
            <h1 className="mb-6 text-3xl font-bold text-gray-900 dark:text-white">
              Forgot Password
            </h1>
            <p className="mb-6 text-gray-600 dark:text-gray-400">
              Enter your email address and we&apos;ll send you a link to reset your password.
            </p>
            
            {error && (
              <Alert type="error" className="mb-4">
                {error}
              </Alert>
            )}
            
            {success && (
              <Alert type="success" className="mb-4">
                {success}
              </Alert>
            )}
            
            <form action={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  disabled={loading}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  placeholder="you@example.com"
                />
              </div>
              <Button type="submit" loading={loading} disabled={loading} className="w-full">
                Send Reset Link
              </Button>
            </form>
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
