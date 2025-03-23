'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function EmailConfirmation() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Supabase handles the verification automatically through the URL parameters
        // We just need to check if the session exists after navigation

        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Verification error:', error);
          setVerificationStatus('error');
          setErrorMessage(error.message);
          return;
        }

        if (data.session) {
          setVerificationStatus('success');
          
          // Redirect to home after 3 seconds
          setTimeout(() => {
            router.push('/');
          }, 3000);
        } else {
          // If no session, check if there's an error message
          const errorDescription = searchParams.get('error_description');
          if (errorDescription) {
            setVerificationStatus('error');
            setErrorMessage(decodeURIComponent(errorDescription));
          } else {
            setVerificationStatus('error');
            setErrorMessage('Email verification failed. The link may have expired.');
          }
        }
      } catch (error) {
        console.error('Unexpected verification error:', error);
        setVerificationStatus('error');
        setErrorMessage('An unexpected error occurred during verification');
      }
    };

    handleEmailConfirmation();
  }, [router, searchParams]);

  return (
    <div className='flex min-h-[calc(100vh-64px)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden dark:bg-black bg-white'>
      {/* Grid background */}
      <div className='absolute inset-0 dark:bg-grid-small-white/[0.2] bg-grid-small-black/[0.05] -z-10' />
      {/* Gradient overlay */}
      <div className='absolute inset-0 dark:bg-gradient-to-b dark:from-black/20 dark:via-black dark:to-black bg-gradient-to-b from-white/80 via-white to-white -z-10' />

      {/* Floating gradient orbs - Vercel style */}
      <div className='absolute top-20 -right-64 w-96 h-96 dark:bg-blue-500 bg-blue-300 rounded-full mix-blend-multiply filter blur-5xl dark:opacity-20 opacity-30 animate-blob animation-delay-2000'></div>
      <div className='absolute -bottom-40 left-20 w-96 h-96 dark:bg-purple-500 bg-purple-300 rounded-full mix-blend-multiply filter blur-5xl dark:opacity-20 opacity-30 animate-blob'></div>

      <div className='w-full max-w-md relative z-10'>
        <div className='dark:bg-gray-900/80 bg-white/80 backdrop-blur-sm border dark:border-gray-800 border-gray-200 rounded-xl shadow-lg p-8'>
          <div className='text-center mb-8'>
            {verificationStatus === 'loading' && (
              <>
                <div className='flex justify-center mb-4'>
                  <Loader2 className='h-12 w-12 text-blue-500 animate-spin' />
                </div>
                <h1 className='text-2xl font-bold dark:text-white text-gray-900 mb-2'>Verifying Your Email</h1>
                <p className='dark:text-gray-400 text-gray-500'>Please wait while we confirm your email address...</p>
              </>
            )}

            {verificationStatus === 'success' && (
              <>
                <div className='flex justify-center mb-4'>
                  <CheckCircle className='h-12 w-12 text-green-500' />
                </div>
                <h1 className='text-2xl font-bold dark:text-white text-gray-900 mb-2'>Email Verified Successfully</h1>
                <p className='dark:text-gray-400 text-gray-500'>Your email has been verified. You'll be redirected to the home page in a few seconds.</p>
              </>
            )}

            {verificationStatus === 'error' && (
              <>
                <div className='flex justify-center mb-4'>
                  <XCircle className='h-12 w-12 text-red-500' />
                </div>
                <h1 className='text-2xl font-bold dark:text-white text-gray-900 mb-2'>Verification Failed</h1>
                <p className='dark:text-gray-400 text-gray-500 mb-6'>{errorMessage}</p>
                <Button 
                  onClick={() => router.push('/signup')} 
                  className='w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-md'
                >
                  Back to Sign Up
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 