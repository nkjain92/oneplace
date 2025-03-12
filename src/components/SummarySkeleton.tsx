// src/components/SummarySkeleton.tsx - Loading skeleton for the summary card
'use client';

import { motion } from 'framer-motion';

export function SummarySkeleton() {
  return (
    <div className='w-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6'>
      <div className='p-6'>
        {/* Title skeleton */}
        <div className='flex items-center mb-4'>
          <div className='w-full'>
            <div className='h-8 bg-gray-200 rounded animate-pulse mb-2 w-3/4'></div>
            <div className='flex items-center'>
              <div className='h-5 w-32 bg-gray-200 rounded animate-pulse'></div>
              <div className='h-5 w-5 rounded-full bg-gray-200 animate-pulse mx-2'></div>
              <div className='h-5 w-24 bg-gray-200 rounded animate-pulse'></div>
            </div>
          </div>
        </div>

        {/* Summary content skeleton */}
        <div className='space-y-3 mt-6'>
          <div className='h-4 bg-gray-200 rounded animate-pulse w-full'></div>
          <div className='h-4 bg-gray-200 rounded animate-pulse w-full'></div>
          <div className='h-4 bg-gray-200 rounded animate-pulse w-11/12'></div>
          <div className='h-4 bg-gray-200 rounded animate-pulse w-full'></div>
          <div className='h-4 bg-gray-200 rounded animate-pulse w-10/12'></div>
          <div className='h-4 bg-gray-200 rounded animate-pulse w-full'></div>
          <div className='h-4 bg-gray-200 rounded animate-pulse w-9/12'></div>
        </div>

        {/* Tags skeleton */}
        <div className='mt-6 flex flex-wrap gap-2'>
          <div className='h-6 w-16 bg-gray-200 rounded-full animate-pulse'></div>
          <div className='h-6 w-20 bg-gray-200 rounded-full animate-pulse'></div>
          <div className='h-6 w-14 bg-gray-200 rounded-full animate-pulse'></div>
          <div className='h-6 w-18 bg-gray-200 rounded-full animate-pulse'></div>
        </div>

        {/* People mentioned skeleton */}
        <div className='mt-6'>
          <div className='h-5 w-40 bg-gray-200 rounded animate-pulse mb-3'></div>
          <div className='flex gap-2'>
            <div className='h-6 w-28 bg-gray-200 rounded-full animate-pulse'></div>
            <div className='h-6 w-24 bg-gray-200 rounded-full animate-pulse'></div>
          </div>
        </div>

        {/* Actions skeleton */}
        <div className='mt-6 pt-4 border-t border-gray-100 flex justify-between'>
          <div className='h-8 w-24 bg-gray-200 rounded animate-pulse'></div>
          <div className='h-8 w-24 bg-gray-200 rounded animate-pulse'></div>
        </div>
      </div>
    </div>
  );
}
