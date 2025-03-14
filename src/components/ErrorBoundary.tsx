//src/components/ErrorBoundary.tsx

'use client';

import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function ErrorBoundary({ 
  children, 
  fallback = (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-900 rounded-lg border border-gray-800 text-gray-300 my-4">
      <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
      <h3 className="text-lg font-medium mb-2">Something went wrong</h3>
      <p className="text-sm text-gray-400 text-center">
        We encountered an error while loading this content. Please try refreshing the page.
      </p>
    </div>
  )
}: ErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Error caught by ErrorBoundary:', event.error);
      setHasError(true);
      // Prevent the error from propagating
      event.preventDefault();
    };

    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  if (hasError) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
