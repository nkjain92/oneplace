import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthProvider';
import Navbar from '@/components/Navbar';

// Initialize the Inter font according to styling guidelines
const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'GetSmart - YouTube Summary Platform',
  description: 'Generate intelligent summaries for YouTube videos and podcasts.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en' className={`${inter.variable}`}>
      <body className='font-sans bg-[#f8f9ff]'>
        <AuthProvider>
          <Navbar />
          <main className='container mx-auto px-4 pt-20'>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
