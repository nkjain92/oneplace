// src/app/api/error.ts - Error handling utilities for API routes
import { NextResponse } from 'next/server';
import { captureException } from '@/lib/sentry';

export interface ApiError {
  message: string;
  code: string;
  status: number;
  details?: Record<string, unknown>;
}

/**
 * Create a standardized error response for API routes
 */
export function createErrorResponse(
  error: Error | unknown,
  status = 500,
  code = 'internal_server_error',
  details?: Record<string, unknown>
) {
  // Determine the error message
  let message = 'An unexpected error occurred';
  
  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  }

  // Capture the error with Sentry
  captureException(error, {
    context: 'API Error',
    status,
    code,
    ...details
  });

  // Log the error
  console.error(`API Error [${code}]:`, error);

  // Create a standardized error response
  const errorResponse: ApiError = {
    message,
    code,
    status,
    ...(details && { details })
  };

  return NextResponse.json(errorResponse, { status });
}

/**
 * Wrap an API route handler with error handling
 */
export function withErrorHandling<T extends Record<string, unknown> = Record<string, unknown>>(
  handler: (req: Request, params?: T) => Promise<Response>
) {
  return async (req: Request, params?: T): Promise<Response> => {
    try {
      return await handler(req, params);
    } catch (error) {
      return createErrorResponse(error);
    }
  };
}
