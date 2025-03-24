// src/app/(auth)/forgot-password/page.tsx - Forgot password page for requesting password reset emails
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { sendPasswordResetOtp } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setIsLoading(true);

    if (!email) {
      setError('Please enter your email address');
      setIsLoading(false);
      return;
    }

    try {
      console.log("📧 Sending password reset OTP to:", email);
      const { error } = await sendPasswordResetOtp(email);
      
      if (error) {
        console.error("❌ Failed to send OTP:", error.message);
        setError(error.message);
        return;
      }
      
      console.log("✅ OTP sent successfully");
      setSuccess(true);
    } catch (error: unknown) {
      console.error('🚨 OTP send error:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to send verification code'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    // Redirect to reset password page with email pre-filled
    router.push(`/reset-password?email=${encodeURIComponent(email)}`);
  };

  return (
    <div className='flex min-h-[calc(100vh-64px)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden dark:bg-black bg-white'>
      {/* Grid background */}
      <div className='absolute inset-0 dark:bg-grid-small-white/[0.2] bg-grid-small-black/[0.05] -z-10' />
      {/* Gradient overlay */}
      <div className='absolute inset-0 dark:bg-gradient-to-b dark:from-black/20 dark:via-black dark:to-black bg-gradient-to-b from-white/80 via-white to-white -z-10' />

      {/* Floating gradient orbs - Vercel style */}
      <div className='absolute top-20 -left-64 w-96 h-96 dark:bg-blue-500 bg-blue-300 rounded-full mix-blend-multiply filter blur-5xl dark:opacity-20 opacity-30 animate-blob'></div>
      <div className='absolute -bottom-40 right-20 w-96 h-96 dark:bg-purple-500 bg-purple-300 rounded-full mix-blend-multiply filter blur-5xl dark:opacity-20 opacity-30 animate-blob animation-delay-2000'></div>

      <div className='w-full max-w-md relative z-10'>
        <div className='dark:bg-gray-900/80 bg-white/80 backdrop-blur-sm border dark:border-gray-800 border-gray-200 rounded-xl shadow-lg p-8'>
          <div className='text-center mb-8'>
            <h1 className='text-2xl font-bold dark:text-white text-gray-900 mb-2'>
              Reset Password
            </h1>
            <p className='dark:text-gray-400 text-gray-500'>
              {success ? "Verification code sent" : "Enter your email to receive a verification code"}
            </p>
          </div>

          {error && (
            <Alert
              variant='destructive'
              className='mb-6 dark:bg-red-900/20 bg-red-100 dark:border-red-800 border-red-300 dark:text-red-400 text-red-600'
            >
              <AlertCircle className='h-4 w-4' />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className='mb-6 dark:bg-green-900/20 bg-green-100 dark:border-green-800 border-green-300 dark:text-green-400 text-green-600'>
              <CheckCircle2 className='h-4 w-4' />
              <AlertDescription>
                Verification code sent. Check your email for the 6-digit code.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSendOtp} className='space-y-6'>
            <div className='space-y-2'>
              <label
                htmlFor='email'
                className='block text-sm font-medium dark:text-gray-300 text-gray-700'
              >
                Email
              </label>
              <Input
                id='email'
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='your@email.com'
                className='dark:bg-gray-800/80 bg-white border dark:border-gray-700 border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:text-white text-gray-900 dark:placeholder:text-gray-500 placeholder:text-gray-400'
                required
              />
            </div>

            {!success ? (
              <Button
                type='submit'
                disabled={isLoading}
                className='w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-md'
              >
                {isLoading ? 'Sending...' : 'Send Verification Code'}
              </Button>
            ) : (
              <Button
                type='button'
                onClick={handleContinue}
                className='w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-md'
              >
                Continue to Reset Password
              </Button>
            )}
            
            {success && (
              <div className="text-center text-sm">
                <button 
                  type="submit"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Resend code
                </button>
              </div>
            )}
            
            <div className="text-xs dark:text-gray-400 text-gray-500 text-center">
              We&apos;ll send a 6-digit verification code to your email
            </div>
          </form>

          <div className='mt-6 text-center text-sm'>
            <span className='dark:text-gray-400 text-gray-500'>
              Remember your password?
            </span>{' '}
            <Link
              href='/login'
              className='dark:text-blue-400 text-blue-600 dark:hover:text-blue-300 hover:text-blue-500 font-medium'
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 