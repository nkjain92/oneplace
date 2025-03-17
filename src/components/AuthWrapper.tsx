// src/components/AuthWrapper.tsx - Component that initializes authentication state for the application
'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import * as Sentry from '@sentry/nextjs';

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { initialize, user } = useAuthStore();

  useEffect(() => {
    initialize(); // Set up the auth state when the app loads
  }, [initialize]);

  // Set Sentry user context when user changes
  useEffect(() => {
    if (user) {
      // Identify user to Sentry for error tracking
      Sentry.setUser({
        id: user.id,
        email: user.email || undefined,
      });
    } else {
      // Clear user data when logged out
      Sentry.setUser(null);
    }
  }, [user]);

  return <>{children}</>; // Just pass the children through
}
