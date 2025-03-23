// src/app/(auth)/reset-password/page.tsx - Reset password page for setting a new password
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { verifyOtpAndUpdatePassword } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ResetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State for OTP info
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  
  // State for password fields
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(3);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Process URL parameters
  useEffect(() => {
    // Parse URL parameters
    const emailParam = searchParams.get('email') || '';
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }
  }, [searchParams]);

  // Start countdown when success state changes to true
  useEffect(() => {
    if (success) {
      countdownRef.current = setInterval(() => {
        setRedirectCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownRef.current as NodeJS.Timeout);
            router.push('/login');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [success, router]);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🔑 Password reset form submitted");
    setError('');
    setSuccess(false);
    setIsLoading(true);

    // Validation
    if (!email || !otp || !password || !confirmPassword) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setIsLoading(false);
      return;
    }

    try {
      console.log("🔄 Verifying OTP and updating password...");
      
      const { error } = await verifyOtpAndUpdatePassword(email, otp, password);
      
      if (error) {
        console.error("❌ Password reset failed:", error.message);
        setError(error.message);
        return;
      }
      
      console.log("✅ Password updated successfully");
      setSuccess(true);
      setRedirectCountdown(3);
    } catch (error: unknown) {
      console.error('🚨 Password reset error details:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to reset password. Please try again or request a new reset link.'
      );
    } finally {
      setIsLoading(false);
    }
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
              {success
                ? 'Your password has been reset successfully'
                : 'Enter the OTP sent to your email and your new password'}
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
                Password reset successful. Redirecting to login in {redirectCountdown} {redirectCountdown === 1 ? 'second' : 'seconds'}...
              </AlertDescription>
            </Alert>
          )}

          {success && (
            <div className='mt-6 text-center'>
              <Link 
                href='/login'
                className='w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md inline-block'
              >
                Go to Login Now
              </Link>
            </div>
          )}

          {!success && (
            <form onSubmit={handlePasswordReset} className='space-y-6'>
              <div className='space-y-2'>
                <label
                  htmlFor='email'
                  className='block text-sm font-medium dark:text-gray-300 text-gray-700'
                >
                  Email Address
                </label>
                <Input
                  id='email'
                  type='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder='your.email@example.com'
                  className='dark:bg-gray-800/80 bg-white border dark:border-gray-700 border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:text-white text-gray-900 dark:placeholder:text-gray-500 placeholder:text-gray-400'
                  required
                />
              </div>

              <div className='space-y-2'>
                <label
                  htmlFor='otp'
                  className='block text-sm font-medium dark:text-gray-300 text-gray-700'
                >
                  One-Time Password (OTP)
                </label>
                <Input
                  id='otp'
                  type='text'
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder='123456'
                  className='dark:bg-gray-800/80 bg-white border dark:border-gray-700 border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:text-white text-gray-900 dark:placeholder:text-gray-500 placeholder:text-gray-400'
                  required
                />
              </div>

              <div className='space-y-2'>
                <label
                  htmlFor='password'
                  className='block text-sm font-medium dark:text-gray-300 text-gray-700'
                >
                  New Password
                </label>
                <Input
                  id='password'
                  type='password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder='••••••••'
                  className='dark:bg-gray-800/80 bg-white border dark:border-gray-700 border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:text-white text-gray-900 dark:placeholder:text-gray-500 placeholder:text-gray-400'
                  required
                  minLength={8}
                />
              </div>

              <div className='space-y-2'>
                <label
                  htmlFor='confirmPassword'
                  className='block text-sm font-medium dark:text-gray-300 text-gray-700'
                >
                  Confirm New Password
                </label>
                <Input
                  id='confirmPassword'
                  type='password'
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder='••••••••'
                  className='dark:bg-gray-800/80 bg-white border dark:border-gray-700 border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:text-white text-gray-900 dark:placeholder:text-gray-500 placeholder:text-gray-400'
                  required
                  minLength={8}
                />
              </div>

              <Button
                type='submit'
                disabled={isLoading}
                className='w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-md'
              >
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </form>
          )}

          {/* Return to login link */}
          {!success && (
            <div className="mt-4 text-center">
              <Link 
                href="/login" 
                className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Back to Login
              </Link>
            </div>
          )}
        </div>
      </div>
      
      {/* Add the auth debugger */}
      <AuthDebugger />
    </div>
  );
}

// Diagnostic component for development
function AuthDebugger() {
  interface SessionInfo {
    hasSession: boolean;
    user: string;
    error: string | null;
    accessToken: string;
    expires: string;
    [key: string]: unknown;
  }

  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.auth.getSession();
        setSessionInfo({
          hasSession: !!data?.session,
          user: data?.session?.user?.email || 'none',
          error: error?.message || null,
          accessToken: data?.session?.access_token ? 'present' : 'none',
          expires: data?.session?.expires_at ? new Date(data.session.expires_at * 1000).toLocaleString() : 'none'
        });
      } catch (err) {
        setSessionInfo({ 
          hasSession: false,
          user: 'none',
          error: err instanceof Error ? err.message : 'Unknown error',
          accessToken: 'none',
          expires: 'none'
        });
      } finally {
        setLoading(false);
      }
    };

    checkSession();
    // Check session every 5 seconds
    const interval = setInterval(checkSession, 5000);
    return () => clearInterval(interval);
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null; // Only show in development
  }

  return (
    <div className="fixed bottom-0 right-0 m-4 p-4 bg-black/80 text-white text-xs rounded shadow-lg max-w-xs z-50 font-mono">
      <h4 className="font-bold mb-2">Auth Debug</h4>
      {loading ? (
        <p>Loading session info...</p>
      ) : (
        <pre>{JSON.stringify(sessionInfo, null, 2)}</pre>
      )}
      <div className="mt-2 text-xs">
        <button 
          onClick={async () => {
            try {
              console.log("Testing API connection...");
              const { data, error } = await supabase.auth.getUser();
              console.log("Auth API response:", { data, error });
              alert(`API connection: ${error ? 'Failed' : 'Success'}\n${error ? error.message : `User: ${data?.user?.email || 'none'}`}`);
            } catch (err) {
              console.error("API test error:", err);
              alert(`API test failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
            }
          }}
          className="bg-blue-600 px-2 py-1 rounded mr-2"
        >
          Test API
        </button>
        <button 
          onClick={async () => {
            try {
              await supabase.auth.signOut();
              alert("Signed out");
            } catch (err) {
              alert(`Sign out error: ${err instanceof Error ? err.message : 'Unknown error'}`);
            }
          }}
          className="bg-red-600 px-2 py-1 rounded"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
} 