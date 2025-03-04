'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { signOut } from '@/lib/auth';

export default function Header() {
  const { user, profile, loading } = useAuth();
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Handle logout action
  const handleLogout = async () => {
    try {
      await signOut();
      // Close dropdown after logout
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Check if a path is the current active path
  const isActive = (path: string) => pathname === path;

  return (
    <header className='fixed top-0 left-0 w-full h-15 z-50 bg-gradient-to-r from-blue-500 to-purple-600 shadow-md'>
      <div className='container mx-auto px-4 h-full flex items-center justify-between'>
        {/* Logo */}
        <Link href='/' className='flex items-center'>
          <span className='text-white font-bold text-xl'>GetSmart</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className='hidden md:flex items-center space-x-6'>
          <Link
            href='/'
            className={`text-white hover:text-blue-100 transition-colors ${
              isActive('/') ? 'font-semibold border-b-2 border-white' : ''
            }`}>
            Home
          </Link>
          <Link
            href='/discover'
            className={`text-white hover:text-blue-100 transition-colors ${
              isActive('/discover') ? 'font-semibold border-b-2 border-white' : ''
            }`}>
            Discover Channels
          </Link>
          <Link
            href='/history'
            className={`text-white hover:text-blue-100 transition-colors ${
              isActive('/history') ? 'font-semibold border-b-2 border-white' : ''
            }`}>
            Past Summaries
          </Link>
        </nav>

        {/* Auth Section - Desktop */}
        <div className='hidden md:flex items-center'>
          {loading ? (
            // Loading state
            <div className='w-8 h-8 rounded-full bg-white/20 animate-pulse'></div>
          ) : user ? (
            // Logged in state
            <div className='relative'>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className='flex items-center text-white hover:text-blue-100 transition-colors'
                aria-label='User menu'
                aria-expanded={isDropdownOpen ? 'true' : 'false'}>
                <span className='mr-2'>Hi, {profile?.name || user.email}</span>
                <svg
                  className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                  aria-hidden='true'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M19 9l-7 7-7-7'
                  />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className='absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50'>
                  <Link
                    href='/subscriptions'
                    className='block px-4 py-2 text-gray-800 hover:bg-gray-100'
                    onClick={() => setIsDropdownOpen(false)}>
                    My Subscriptions
                  </Link>
                  <button
                    onClick={handleLogout}
                    className='block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100'>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            // Logged out state
            <div className='flex items-center space-x-4'>
              <Link href='/login' className='text-white hover:text-blue-100 transition-colors'>
                Login
              </Link>
              <Link
                href='/signup'
                className='bg-white text-blue-600 hover:bg-blue-50 py-2 px-4 rounded-md transition-colors'>
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className='md:hidden text-white'
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isMobileMenuOpen ? 'true' : 'false'}>
          <svg
            className='w-6 h-6'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
            aria-hidden='true'>
            {isMobileMenuOpen ? (
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M6 18L18 6M6 6l12 12'
              />
            ) : (
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M4 6h16M4 12h16M4 18h16'
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className='md:hidden bg-blue-600 py-4'>
          <div className='container mx-auto px-4 flex flex-col space-y-4'>
            <Link
              href='/'
              className={`text-white hover:text-blue-100 transition-colors ${
                isActive('/') ? 'font-semibold' : ''
              }`}
              onClick={() => setIsMobileMenuOpen(false)}>
              Home
            </Link>
            <Link
              href='/discover'
              className={`text-white hover:text-blue-100 transition-colors ${
                isActive('/discover') ? 'font-semibold' : ''
              }`}
              onClick={() => setIsMobileMenuOpen(false)}>
              Discover Channels
            </Link>
            <Link
              href='/history'
              className={`text-white hover:text-blue-100 transition-colors ${
                isActive('/history') ? 'font-semibold' : ''
              }`}
              onClick={() => setIsMobileMenuOpen(false)}>
              Past Summaries
            </Link>

            {/* Mobile Auth Section */}
            {loading ? (
              <div className='w-8 h-8 rounded-full bg-white/20 animate-pulse'></div>
            ) : user ? (
              <div className='flex flex-col space-y-2 border-t border-blue-500 pt-2'>
                <div className='text-white font-medium'>Hi, {profile?.name || user.email}</div>
                <Link
                  href='/subscriptions'
                  className='text-white hover:text-blue-100 transition-colors'
                  onClick={() => setIsMobileMenuOpen(false)}>
                  My Subscriptions
                </Link>
                <button
                  onClick={handleLogout}
                  className='text-white hover:text-blue-100 transition-colors text-left'>
                  Logout
                </button>
              </div>
            ) : (
              <div className='flex flex-col space-y-2 border-t border-blue-500 pt-2'>
                <Link
                  href='/login'
                  className='text-white hover:text-blue-100 transition-colors'
                  onClick={() => setIsMobileMenuOpen(false)}>
                  Login
                </Link>
                <Link
                  href='/signup'
                  className='bg-white text-blue-600 hover:bg-blue-50 py-2 px-4 rounded-md transition-colors inline-block'
                  onClick={() => setIsMobileMenuOpen(false)}>
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
