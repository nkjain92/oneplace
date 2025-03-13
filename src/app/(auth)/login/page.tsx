// src/app/(auth)/login/page.tsx - Login page with email and password authentication
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email || !password) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    try {
      await signIn(email, password);
      router.push('/');
    } catch (error: unknown) {
      console.error('Login error:', error);
      setError(error instanceof Error ? error.message : 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='flex min-h-[calc(100vh-64px)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden'>
      {/* Grid background */}
      <div className='absolute inset-0 bg-grid-small-white/[0.2] -z-10' />
      {/* Gradient overlay */}
      <div className='absolute inset-0 bg-gradient-to-b from-black/20 via-black to-black -z-10' />

      {/* Floating gradient orbs - Vercel style */}
      <div className='absolute top-20 -left-64 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-5xl opacity-20 animate-blob'></div>
      <div className='absolute -bottom-40 right-20 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-5xl opacity-20 animate-blob animation-delay-2000'></div>

      <div className='w-full max-w-md relative z-10'>
        <div className='bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl shadow-lg p-8'>
          <div className='text-center mb-8'>
            <h1 className='text-2xl font-bold text-white mb-2'>Welcome Back</h1>
            <p className='text-gray-400'>Sign in to your account to continue</p>
          </div>

          {error && (
            <Alert variant='destructive' className='mb-6 bg-red-900/20 border-red-800 text-red-400'>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className='space-y-6'>
            <div className='space-y-2'>
              <label htmlFor='email' className='block text-sm font-medium text-gray-300'>
                Email
              </label>
              <Input
                id='email'
                type='email'
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder='your@email.com'
                className='bg-gray-800/80 border-gray-700 focus:border-blue-500 focus:ring-blue-500 text-white placeholder:text-gray-500'
                required
              />
            </div>

            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <label htmlFor='password' className='block text-sm font-medium text-gray-300'>
                  Password
                </label>
                <Link href='/forgot-password' className='text-sm text-blue-400 hover:text-blue-300'>
                  Forgot password?
                </Link>
              </div>
              <Input
                id='password'
                type='password'
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder='••••••••'
                className='bg-gray-800/80 border-gray-700 focus:border-blue-500 focus:ring-blue-500 text-white placeholder:text-gray-500'
                required
              />
            </div>

            <Button
              type='submit'
              disabled={isLoading}
              className='w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-md'>
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <div className='mt-6 text-center text-sm'>
            <span className='text-gray-400'>Don&apos;t have an account?</span>{' '}
            <Link href='/signup' className='text-blue-400 hover:text-blue-300 font-medium'>
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
