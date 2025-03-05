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
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='flex min-h-[calc(100vh-64px)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-purple-50'>
      <div className='w-full max-w-md'>
        <div className='bg-white rounded-xl shadow-sm border border-gray-100 p-8'>
          <div className='text-center mb-8'>
            <h1 className='text-2xl font-bold text-[#4263eb] mb-2'>Welcome Back</h1>
            <p className='text-gray-500'>Sign in to your account to continue</p>
          </div>

          {error && (
            <Alert variant='destructive' className='mb-6'>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className='space-y-6'>
            <div className='space-y-2'>
              <label htmlFor='email' className='block text-sm font-medium text-gray-700'>
                Email
              </label>
              <Input
                id='email'
                type='email'
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder='your@email.com'
                className='border-gray-200 focus:border-[#4263eb] focus:ring-[#4263eb] bg-white'
                required
              />
            </div>

            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <label htmlFor='password' className='block text-sm font-medium text-gray-700'>
                  Password
                </label>
                <Link
                  href='/forgot-password'
                  className='text-sm text-[#4263eb] hover:text-[#3b5bdb]'>
                  Forgot password?
                </Link>
              </div>
              <Input
                id='password'
                type='password'
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder='••••••••'
                className='border-gray-200 focus:border-[#4263eb] focus:ring-[#4263eb] bg-white'
                required
              />
            </div>

            <Button
              type='submit'
              disabled={isLoading}
              className='w-full bg-[#4263eb] hover:bg-[#3b5bdb] text-white font-medium py-2'>
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <div className='mt-6 text-center text-sm'>
            <span className='text-gray-600'>Don't have an account?</span>{' '}
            <Link href='/signup' className='text-[#4263eb] hover:text-[#3b5bdb] font-medium'>
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
