// src/app/(auth)/signup/page.tsx - User registration page with form validation
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUp } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
      router.push('/');
    } catch (error: unknown) {
      console.error('Signup error:', error);
      setError(error instanceof Error ? error.message : 'Failed to sign up');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='flex min items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-purple-50'>
      <div className='w-full max-w-md'>
        <div className='bg-white rounded-xl shadow-sm border border-gray-100 p-8'>
          <div className='text-center mb-8'>
            <h1 className='text-2xl font-bold text-[#4263eb] mb-2'>Create an Account</h1>
            <p className='text-gray-500'>Sign up to get started with OnePlace</p>
          </div>

          {error && (
            <Alert variant='destructive' className='mb-6'>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSignUp} className='space-y-6'>
            <div className='space-y-2'>
              <label htmlFor='name' className='block text-sm font-medium text-gray-700'>
                Full Name
              </label>
              <Input
                id='name'
                type='text'
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder='John Doe'
                className='border-gray-200 focus:border-[#4263eb] focus:ring-[#4263eb] bg-white'
                required
              />
            </div>

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
              <label htmlFor='password' className='block text-sm font-medium text-gray-700'>
                Password
              </label>
              <Input
                id='password'
                type='password'
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder='••••••••'
                className='border-gray-200 focus:border-[#4263eb] focus:ring-[#4263eb] bg-white'
                required
              />
              <p className='text-xs text-gray-500'>Must be at least 6 characters</p>
            </div>

            <Button
              type='submit'
              disabled={isLoading}
              className='w-full bg-[#4263eb] hover:bg-[#3b5bdb] text-white font-medium py-2'>
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <div className='mt-6 text-center text-sm'>
            <span className='text-gray-600'>Already have an account?</span>{' '}
            <Link href='/login' className='text-[#4263eb] hover:text-[#3b5bdb] font-medium'>
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
