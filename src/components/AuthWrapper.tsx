'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize(); // Set up the auth state when the app loads
  }, [initialize]);

  return <>{children}</>; // Just pass the children through
}
