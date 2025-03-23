// src/app/(auth)/signup/page.tsx - User registration page with form validation
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUp } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!name || !email || !password) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    try {
      await signUp(name, email, password);
      setVerificationSent(true);
    } catch (error: unknown) {
      console.error('Signup error:', error);
      setError(error instanceof Error ? error.message : 'Failed to sign up');
    } finally {
      setIsLoading(false);
    }
  };

  if (verificationSent) {
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
              <div className='flex justify-center mb-4'>
                <CheckCircle2 className='h-12 w-12 text-green-500' />
              </div>
              <h1 className='text-2xl font-bold dark:text-white text-gray-900 mb-2'>Verification Email Sent</h1>
              <p className='dark:text-gray-400 text-gray-500 mb-2'>
                We've sent a verification link to <strong>{email}</strong>
              </p>
              <p className='dark:text-gray-400 text-gray-500 mb-6'>
                Please check your inbox and follow the link to complete your registration. If you don't see the email, check your spam folder.
              </p>
              <div className='mt-6'>
                <Link href='/login'>
                  <Button className='w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-md'>
                    Return to Login
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            <h1 className='text-2xl font-bold dark:text-white text-gray-900 mb-2'>Create an Account</h1>
            <p className='dark:text-gray-400 text-gray-500'>Sign up to get started with OnePlace</p>
          </div>

          {error && (
            <Alert variant='destructive' className='mb-6 dark:bg-red-900/20 bg-red-100 dark:border-red-800 border-red-300 dark:text-red-400 text-red-600'>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSignUp} className='space-y-6'>
            <div className='space-y-2'>
              <label htmlFor='name' className='block text-sm font-medium dark:text-gray-300 text-gray-700'>
                Full Name
              </label>
              <Input
                id='name'
                type='text'
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder='John Doe'
                className='dark:bg-gray-800/80 bg-white border dark:border-gray-700 border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:text-white text-gray-900 dark:placeholder:text-gray-500 placeholder:text-gray-400'
                required
              />
            </div>

            <div className='space-y-2'>
              <label htmlFor='email' className='block text-sm font-medium dark:text-gray-300 text-gray-700'>
                Email
              </label>
              <Input
                id='email'
                type='email'
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder='your@email.com'
                className='dark:bg-gray-800/80 bg-white border dark:border-gray-700 border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:text-white text-gray-900 dark:placeholder:text-gray-500 placeholder:text-gray-400'
                required
              />
            </div>

            <div className='space-y-2'>
              <label htmlFor='password' className='block text-sm font-medium dark:text-gray-300 text-gray-700'>
                Password
              </label>
              <Input
                id='password'
                type='password'
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder='••••••••'
                className='dark:bg-gray-800/80 bg-white border dark:border-gray-700 border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:text-white text-gray-900 dark:placeholder:text-gray-500 placeholder:text-gray-400'
                required
              />
              <p className='text-xs dark:text-gray-500 text-gray-500'>Must be at least 6 characters</p>
            </div>

            <Button
              type='submit'
              disabled={isLoading}
              className='w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-md'>
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <div className='mt-6 text-center text-sm'>
            <span className='dark:text-gray-400 text-gray-500'>Already have an account?</span>{' '}
            <Link href='/login' className='dark:text-blue-400 text-blue-600 dark:hover:text-blue-300 hover:text-blue-500 font-medium'>
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
