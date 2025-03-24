'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import EmailConfirmationClient from './components/EmailConfirmationClient';

export default function EmailConfirmation() {
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
          <Suspense fallback={
            <div className='text-center mb-8'>
              <div className='flex justify-center mb-4'>
                <Loader2 className='h-12 w-12 text-blue-500 animate-spin' />
              </div>
              <h1 className='text-2xl font-bold dark:text-white text-gray-900 mb-2'>Loading</h1>
              <p className='dark:text-gray-400 text-gray-500'>Please wait...</p>
            </div>
          }>
            <EmailConfirmationClient />
          </Suspense>
        </div>
      </div>
    </div>
  );
} 