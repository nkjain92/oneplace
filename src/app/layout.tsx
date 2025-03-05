import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '../context/AuthProvider';
import Navbar from '@/components/Navbar';

// Initialize the Inter font according to styling guidelines
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'GetSmart',
  description: 'A smarter way to learn from videos and podcasts',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en' className={`${inter.variable}`}>
      <body className='min-h-screen bg-gray-50 font-sans'>
        <AuthProvider>
          <Navbar />
          <main className='container mx-auto px-4 pt-20'>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
