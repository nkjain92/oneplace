// src/components/YoutubeUrlInput.tsx - A reusable YouTube URL input component

'use client';

import { useState } from 'react';
import { isValidYouTubeUrl } from '@/lib/utils/youtube';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  placeholder = 'Enter YouTube URL',
  buttonText = 'Generate Summary',
  className = '',
}: YoutubeUrlInputProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Reset error state
    setError(null);

    // Validate URL before submitting
    if (!url) {
      setError('Please enter a YouTube URL');
      return;
    }

    if (!isValidYouTubeUrl(url)) {
      setError('Please enter a valid YouTube URL');
      return;
    }

    // Call the onSubmit callback with the validated URL
    onSubmit(url);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    setIsDirty(true);

    // Clear error when user starts typing
    if (error) setError(null);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <form onSubmit={handleSubmit} className='space-y-4'>
        <div className='space-y-2'>
          <Label htmlFor='youtube-url' className='text-gray-300'>
            YouTube URL
          </Label>
          <div className='flex flex-col md:flex-row gap-4'>
            <Input
              id='youtube-url'
              type='url'
              placeholder={placeholder}
              value={url}
              onChange={handleChange}
              className='flex-1 bg-muted border-accent/20 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-500'
              aria-invalid={!!error}
              aria-describedby={error ? 'youtube-url-error' : undefined}
              required
            />
            <Button
              type='submit'
              disabled={isLoading || (!url && isDirty)}
              className='premium-button'>
              {isLoading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Processing...
                </>
              ) : (
                buttonText
              )}
            </Button>
          </div>
        </div>
      </form>

      {error && (
        <Alert variant='destructive' className='bg-destructive/20 border-destructive/50 text-white'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription id='youtube-url-error'>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
