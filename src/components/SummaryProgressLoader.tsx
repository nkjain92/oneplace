// src/components/SummaryProgressLoader.tsx - Progress loader for summary generation

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [progress, setProgress] = useState(0);

  // Reset state when visibility changes
  useEffect(() => {
    if (isVisible) {
      setCurrentStepIndex(0);
      setIsComplete(false);
      setProgress(0);
    }
  }, [isVisible]);

  // Progress through steps automatically
  useEffect(() => {
    if (!isVisible) return;

    // Calculate time per step
    const timePerStep = (durationInSeconds * 1000) / SUMMARY_STEPS.length;
    const progressInterval = 30; // Update progress every 30ms for smoother animation
    const progressIncrement = 100 / ((timePerStep * SUMMARY_STEPS.length) / progressInterval);

    // Set up interval to update progress continuously
    const progressTimer = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + progressIncrement;
        return newProgress >= 100 ? 100 : newProgress;
      });
    }, progressInterval);

    // Set up interval to progress through steps
    const stepTimer = setInterval(() => {
      setCurrentStepIndex(prev => {
        const nextIndex = prev + 1;
        if (nextIndex >= SUMMARY_STEPS.length) {
          clearInterval(stepTimer);
          clearInterval(progressTimer);
          setIsComplete(true);
          setProgress(100);
          return prev;
        }
        return nextIndex;
      });
    }, timePerStep);

    return () => {
      clearInterval(stepTimer);
      clearInterval(progressTimer);
    };
  }, [isVisible, durationInSeconds]);

  if (!isVisible) return null;

  // Get current step
  const currentStep = SUMMARY_STEPS[currentStepIndex];
  
  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-4 mt-4">
      {/* Combined progress bar and status */}
      <div className="flex items-center gap-3 mb-2.5">
        {/* Status indicator */}
        <div className="flex items-center flex-shrink-0">
          {isComplete ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}>
              <Loader2 className="h-5 w-5 text-primary" />
            </motion.div>
          )}
        </div>
        
        {/* Progress bar */}
        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden flex-grow">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-primary rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: "easeInOut" }}
          />
        </div>
        
        {/* Percentage */}
        <div className="text-sm font-medium text-primary bg-primary/5 px-2 py-0.5 rounded-full flex-shrink-0 min-w-[48px] text-center">
          {Math.round(progress)}%
        </div>
      </div>
      
      {/* Step indicators and current step label in one line */}
      <div className="flex items-center justify-between">
        {/* Current step with animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep.key}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 5 }}
            transition={{ duration: 0.2 }}
            className="text-sm font-medium text-gray-700 flex items-center"
          >
            {isComplete ? "Summary complete! Displaying results..." : currentStep.label}
          </motion.div>
        </AnimatePresence>
        
        {/* Step dots */}
        <div className="flex items-center space-x-1.5">
          {SUMMARY_STEPS.map((step, index) => {
            const isActive = index === currentStepIndex;
            const isDone = index < currentStepIndex || isComplete;
            
            return (
              <div 
                key={step.key}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  isActive ? 'bg-primary scale-125' : 
                  isDone ? 'bg-green-500' : 'bg-gray-200'
                }`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
