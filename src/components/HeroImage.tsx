// src/components/HeroImage.tsx - Component that displays an illustrative SVG for the homepage hero section
import React from 'react';

export default function HeroImage() {
  return (
    <div className='relative w-full max-w-md mx-auto'>
      {/* This is a placeholder SVG illustration that shows a content summarization concept */}
      <div className='rounded-lg bg-white p-4 shadow-sm border border-gray-100'>
        <svg
          xmlns='http://www.w3.org/2000/svg'
          width='100%'
          height='280'
          viewBox='0 0 400 280'
          fill='none'>
          {/* Video player frame */}
          <rect x='30' y='20' width='340' height='180' rx='8' fill='#F3F4FF' />
          <rect x='50' y='40' width='300' height='140' rx='4' fill='#4263EB' opacity='0.1' />

          {/* Play button */}
          <circle cx='200' cy='110' r='30' fill='#4263EB' />
          <path d='M210 110L195 120V100L210 110Z' fill='white' />

          {/* Summary notes */}
          <rect x='50' y='210' width='300' height='10' rx='2' fill='#E2E8F0' />
          <rect x='50' y='230' width='260' height='10' rx='2' fill='#E2E8F0' />
          <rect x='50' y='250' width='220' height='10' rx='2' fill='#E2E8F0' />

          {/* Connection lines */}
          <path d='M150 140L80 210' stroke='#4263EB' strokeWidth='2' strokeDasharray='4 4' />
          <path d='M250 140L320 210' stroke='#4263EB' strokeWidth='2' strokeDasharray='4 4' />

          {/* Decorative elements */}
          <circle cx='50' cy='210' r='5' fill='#4263EB' />
          <circle cx='50' cy='230' r='5' fill='#4263EB' />
          <circle cx='50' cy='250' r='5' fill='#4263EB' />
        </svg>
      </div>

      {/* Background decorative elements */}
      <div className='absolute -z-10 -top-6 -right-6 w-32 h-32 bg-purple-100 rounded-full opacity-50'></div>
      <div className='absolute -z-10 -bottom-8 -left-8 w-40 h-40 bg-blue-100 rounded-full opacity-60'></div>
    </div>
  );
}
