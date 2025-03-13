// src/app/layout.tsx - Root layout component that defines the overall structure for all pages
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import { AuthWrapper } from '@/components/AuthWrapper';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

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
    <html lang='en' className={`${inter.variable} dark`}>
      <body className='font-sans bg-black text-white min-h-screen'>
        <AuthWrapper>
          <Navbar />
          {children}
        </AuthWrapper>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
