// src/lib/sentry.ts - Utility functions for Sentry error tracking
import * as Sentry from '@sentry/nextjs';

/**
 * Capture an exception with additional context
 * @param error The error to capture
 * @param context Additional context to add to the error
 */
export const captureException = (
  error: Error | unknown,
  context?: Record<string, unknown>
): void => {
  // Ensure we have an Error object
  const errorObject = error instanceof Error ? error : new Error(String(error));

  // Add additional context if provided
  if (context) {
    // Set extra context for the error
    Object.entries(context).forEach(([key, value]) => {
      Sentry.setExtra(key, value);
    });
  }

  // Capture the exception
  Sentry.captureException(errorObject);
};

/**
 * Set user information for Sentry tracking
 * @param user User information
 */
export const setUser = (user: { id: string; email?: string; username?: string }): void => {
  Sentry.setUser(user);
};

/**
 * Clear user information from Sentry
 */
export const clearUser = (): void => {
  Sentry.setUser(null);
};

/**
 * Add breadcrumb to Sentry
 * @param breadcrumb Breadcrumb information
 */
export const addBreadcrumb = (breadcrumb: {
  category: string;
  message: string;
  level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
  data?: Record<string, unknown>;
}): void => {
  Sentry.addBreadcrumb(breadcrumb);
};

/**
 * Wrap a function with error monitoring
 * @param fn Function to wrap with error monitoring
 * @param errorContext Additional context to add to any errors
 */
export const withErrorMonitoring = async <T>(
  fn: () => Promise<T>,
  errorContext?: Record<string, unknown>
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    captureException(error, errorContext);
    throw error;
  }
};
