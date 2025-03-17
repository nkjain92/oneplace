'use client';

import { Button } from '@/components/ui/button';
import * as Sentry from '@sentry/nextjs';
import { captureException } from '@/lib/sentry';

/**
 * A test component to verify Sentry integration
 * This component can be temporarily added to any page to test Sentry error reporting
 */
export default function SentryTest() {
  // Test a captured exception
  const testCapture = () => {
    try {
      // Intentionally throw an error
      throw new Error('This is a test error captured by Sentry');
    } catch (error) {
      captureException(error, {
        source: 'SentryTest component',
        testCase: 'manual capture'
      });
      alert('Test error captured. Check Sentry dashboard.');
    }
  };

  // Test an uncaught exception
  const testUncaught = () => {
    // This will trigger the ErrorBoundary
    throw new Error('This is an uncaught test error');
  };

  // Test a frontend error with context
  const testWithContext = () => {
    // Set tags directly
    Sentry.setTag('test-tag', 'test-value');
    
    // Set test user
    Sentry.setUser({
      id: 'test-user-id',
      email: 'test@example.com',
    });
    
    // Set extra data
    Sentry.setExtra('additionalData', {
      testKey: 'testValue',
      timestamp: new Date().toISOString(),
    });

    Sentry.captureMessage('This is a test message with context');
    alert('Test message with context sent. Check Sentry dashboard.');
  };

  return (
    <div className="p-4 border border-gray-800 rounded-lg bg-gray-900 my-4">
      <h3 className="text-lg font-medium mb-4">Sentry Test Panel</h3>
      <div className="flex flex-col gap-2">
        <Button onClick={testCapture} variant="outline" size="sm">
          Test Captured Exception
        </Button>
        <Button onClick={testWithContext} variant="outline" size="sm">
          Test With Context
        </Button>
        <Button onClick={testUncaught} variant="destructive" size="sm">
          Test Uncaught Exception
        </Button>
        <p className="text-xs text-gray-500 mt-2">
          Note: The &quot;Test Uncaught Exception&quot; button will cause an error to be displayed.
        </p>
      </div>
    </div>
  );
}
