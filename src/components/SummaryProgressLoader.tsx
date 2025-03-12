// src/components/SummaryProgressLoader.tsx - Progress loader for summary generation

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2 } from 'lucide-react';

// Define the stages of summary generation
const SUMMARY_STEPS = [
  { key: 'fetch', label: 'Fetching transcript' },
  { key: 'analyze', label: 'Analyzing content' },
  { key: 'summarize', label: 'Generating summary' },
  { key: 'polish', label: 'Polishing results' },
];

interface SummaryProgressLoaderProps {
  isVisible: boolean;
  durationInSeconds?: number;
}

export function SummaryProgressLoader({
  isVisible,
  durationInSeconds = 8,
}: SummaryProgressLoaderProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // Reset state when visibility changes
  useEffect(() => {
    if (isVisible) {
      setCurrentStepIndex(0);
      setIsComplete(false);
    }
  }, [isVisible]);

  // Progress through steps automatically
  useEffect(() => {
    if (!isVisible) return;

    // Calculate time per step
    const timePerStep = (durationInSeconds * 1000) / SUMMARY_STEPS.length;

    // Set up interval to progress through steps
    const interval = setInterval(() => {
      setCurrentStepIndex(prev => {
        const nextIndex = prev + 1;
        if (nextIndex >= SUMMARY_STEPS.length) {
          clearInterval(interval);
          setIsComplete(true);
          return prev;
        }
        return nextIndex;
      });
    }, timePerStep);

    return () => clearInterval(interval);
  }, [isVisible, durationInSeconds]);

  if (!isVisible) return null;

  return (
    <div className='w-full max-w-md mx-auto bg-white rounded-lg shadow-md p-6 mt-4'>
      <h3 className='text-lg font-medium text-gray-900 mb-4'>Generating your summary...</h3>

      <div className='space-y-3'>
        {SUMMARY_STEPS.map((step, index) => {
          const isActive = index === currentStepIndex;
          const isCompleted = index < currentStepIndex || isComplete;

          return (
            <div key={step.key} className='flex items-center'>
              <div className='mr-3'>
                {isCompleted ? (
                  <CheckCircle2 className='h-5 w-5 text-green-500' />
                ) : isActive ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                    <Loader2 className='h-5 w-5 text-primary' />
                  </motion.div>
                ) : (
                  <div className='h-5 w-5 rounded-full border-2 border-gray-200' />
                )}
              </div>

              <div className='flex-1'>
                <div
                  className={`text-sm font-medium ${
                    isActive ? 'text-primary' : isCompleted ? 'text-green-600' : 'text-gray-500'
                  }`}>
                  {step.label}
                </div>

                {isActive && !isComplete && (
                  <motion.div
                    className='h-1 bg-primary/20 mt-1 rounded-full overflow-hidden'
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}>
                    <motion.div
                      className='h-full bg-primary rounded-full'
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{
                        duration: durationInSeconds / SUMMARY_STEPS.length,
                        ease: 'linear',
                      }}
                    />
                  </motion.div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isComplete && (
        <motion.div
          className='mt-4 text-center text-sm text-gray-600'
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}>
          Summary complete! Displaying results...
        </motion.div>
      )}
    </div>
  );
}
