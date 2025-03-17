//src/components/ErrorBoundary.tsx

'use client';

import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import * as Sentry from '@sentry/nextjs';
import { captureException } from '@/lib/sentry';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  name?: string; // Component or section name for better error context
  fallback?: React.ReactNode;
}

export default function ErrorBoundary({ 
  children, 
  name = 'component',
  fallback = (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-900 rounded-lg border border-gray-800 text-gray-300 my-4">
      <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
      <h3 className="text-lg font-medium mb-2">Something went wrong</h3>
      <p className="text-sm text-gray-400 text-center">
        We encountered an error while loading this content. Please try refreshing the page.
      </p>
      <button 
        onClick={() => window.location.reload()} 
        className="mt-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm transition-colors"
      >
        Refresh Page
      </button>
    </div>
  )
}: ErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      // Capture the error with Sentry
      captureException(event.error, { 
        component: name,
        errorType: 'client-side-error',
        url: window.location.href
      });
      
      console.error(`Error caught by ErrorBoundary in ${name}:`, event.error);
      setHasError(true);
      
      // Prevent the error from propagating
      event.preventDefault();
    };

    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, [name]);

  // Report error to Sentry when user manually reports an issue
  const reportIssue = () => {
    Sentry.showReportDialog();
  };

  if (hasError) {
    return (
      <>
        {fallback}
        <div className="text-center mt-2">
          <button 
            onClick={reportIssue}
            className="text-xs text-gray-500 hover:text-gray-400 underline"
          >
            Report this issue
          </button>
        </div>
      </>
    );
  }

  return <>{children}</>;
}
