// src/app/layout.tsx - Root layout component that defines the overall structure for all pages
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import { AuthWrapper } from '@/components/AuthWrapper';
import { ThemeProvider } from '@/context/ThemeProvider';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import ErrorBoundary from '@/components/ErrorBoundary';

// Initialize the Inter font according to styling guidelines
const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'OnePlace - AI-powered platform for knowledge',
  description:
    'Generate intelligent summaries for YouTube videos and get new ones in your inbox daily.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en' className={inter.variable} suppressHydrationWarning>
      <head>
        {/* 
          Script uses Next.js recommended pattern for dark mode - no flash, no hydration mismatch
          https://nextjs.org/docs/app/building-your-application/rendering/client-components#avoiding-hydration-mismatch
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var storageTheme = localStorage.getItem('theme');
                  var systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  var theme = storageTheme || systemTheme;
                  
                  document.documentElement.classList.remove('light', 'dark');
                  document.documentElement.classList.add(theme);
                } catch (e) {
                  document.documentElement.classList.add('dark');
                }
              })()
            `,
          }}
        />
      </head>
      <body className='font-sans min-h-screen'>
        <ErrorBoundary name="root">
          <ThemeProvider>
            <AuthWrapper>
              <Navbar />
              <ErrorBoundary name="content">
                {children}
              </ErrorBoundary>
            </AuthWrapper>
            <SpeedInsights />
            <Analytics />
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
