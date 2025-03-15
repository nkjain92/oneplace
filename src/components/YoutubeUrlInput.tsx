// src/components/YoutubeUrlInput.tsx - Elegant YouTube URL input component

'use client';

import { useState, useRef, useEffect } from 'react';
import { isValidYouTubeUrl } from '@/lib/utils/youtube';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, CheckCircle2, Youtube } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface YoutubeUrlInputProps {
  onSubmit: (url: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  buttonText?: string;
  className?: string;
}

export function YoutubeUrlInput({
  onSubmit,
  isLoading = false,
  placeholder = 'Paste YouTube URL',
  buttonText = 'Generate',
  className = '',
}: YoutubeUrlInputProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Validate URL whenever it changes
    if (url) {
      const valid = isValidYouTubeUrl(url);
      setIsValid(valid);
      if (isDirty && !valid) {
        setError('Please enter a valid YouTube URL');
      } else {
        setError(null);
      }
    } else {
      setIsValid(false);
      if (isDirty) {
        setError('Please enter a YouTube URL');
      }
    }
  }, [url, isDirty]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsDirty(true);

    // Validate URL before submitting
    if (!url) {
      setError('Please enter a YouTube URL');
      inputRef.current?.focus();
      return;
    }

    if (!isValidYouTubeUrl(url)) {
      setError('Please enter a valid YouTube URL');
      inputRef.current?.focus();
      return;
    }

    // Call the onSubmit callback with the validated URL
    onSubmit(url);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    setIsDirty(true);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <form onSubmit={handleSubmit}>
        <div
          className='relative rounded-md p-2 border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm shadow-sm hover:border-blue-700/50 dark:hover:border-blue-500/50 transition-all duration-300'
        >
          <div className='flex items-center'>
            {/* YouTube icon */}
            <div className='pl-3'>
              <Youtube
                size={20}
                className='text-blue-600 dark:text-blue-400'
              />
            </div>

            {/* Input field */}
            <Input
              ref={inputRef}
              id='youtube-url'
              type='text'
              placeholder={placeholder}
              value={url}
              onChange={handleChange}
              className={`flex-1 border-0 bg-transparent h-12 focus:ring-0 pl-2 pr-4 user-select-text selection:bg-blue-200/50 dark:selection:bg-blue-900/50 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 ${
                error ? 'text-red-600 dark:text-red-400' : isValid && url ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'
              }`}
              style={{
                boxShadow: 'none',
                WebkitUserSelect: 'text',
                userSelect: 'text',
              }}
              aria-invalid={!!error}
              aria-describedby={error ? 'youtube-url-error' : undefined}
              required
            />

            {/* Status indicator */}
            <AnimatePresence mode='wait'>
              {url && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className='mr-2'
                >
                  {isValid ? (
                    <CheckCircle2 className='h-5 w-5 text-green-600 dark:text-green-500' />
                  ) : (
                    <AlertCircle className='h-5 w-5 text-amber-600 dark:text-amber-500' />
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit button */}
            <Button
              type='submit'
              disabled={isLoading || (!isValid && isDirty)}
              className='bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-md px-4 py-2 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {isLoading ? 'Processing...' : buttonText}
            </Button>
          </div>
        </div>
      </form>

      {/* Error message - now a simple text below the input */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
            className='px-4'
          >
            <div className='flex items-center text-sm text-red-600 dark:text-red-400' id='youtube-url-error'>
              <AlertCircle className='h-3.5 w-3.5 mr-1.5' />
              <span>{error}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}