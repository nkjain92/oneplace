// src/context/ThemeProvider.tsx - Theme context and provider for managing application theme
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Use 'dark' as fallback but state will be updated on mount
  const [theme, setTheme] = useState<Theme>('dark');
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize theme from localStorage on mount (client-side only)
  useEffect(() => {
    // Read from the same source our script uses
    const storedTheme = localStorage.getItem('theme') as Theme;
    const isDarkPreferred = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = storedTheme || (isDarkPreferred ? 'dark' : 'light');

    // First set the correct state
    setTheme(initialTheme);
    setIsInitialized(true);
  }, []);

  // Update DOM when theme changes AFTER initial mount
  useEffect(() => {
    // Skip the first render to avoid hydration mismatch
    // Our inline script already set the theme correctly
    if (!isInitialized) return;
    
    const root = document.documentElement;
    
    // Clean approach to class toggling - remove both, add the current one
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    
    localStorage.setItem('theme', theme);
  }, [theme, isInitialized]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const contextValue = {
    theme,
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
};
