// src/components/Navbar.tsx - Navigation component with Vellum-inspired design and authentication handling
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { signOut } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { ChevronDown, X, Menu, History, Compass, Home, LogOut, BookOpen } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

// Define navigation links and dropdown menus
const navLinks = [
  {
    title: 'Home',
    href: '/',
    icon: Home,
  },
  {
    title: 'Discover Channels',
    href: '/discover',
    icon: Compass,
  },
  {
    title: 'History',
    href: '/history?filter=all',
    icon: History,
  },
];

export default function Navbar() {
  const { user, profile, loading } = useAuthStore();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close profile dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setProfileDropdownOpen(false);
      }

      // Close mobile menu when clicking outside
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node) &&
        // Don't close if clicking the toggle button
        !(event.target as Element).closest('button[aria-label="Toggle mobile menu"]')
      ) {
        setIsMobileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle logout action
  const handleLogout = async () => {
    try {
      await signOut();
      // Close dropdowns after logout is processed
      setProfileDropdownOpen(false);
      setIsMobileMenuOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Disable body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isMobileMenuOpen]);

  // Handle dropdown toggle without interfering with navigation
  const handleProfileDropdownToggle = () => {
    setProfileDropdownOpen(!profileDropdownOpen);
  };

  // Handle mobile menu toggle
  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Handle dropdown menu item click
  const handleDropdownItemClick = (e: React.MouseEvent) => {
    // Only stop propagation to prevent the dropdown from closing
    // but don't prevent default to allow navigation
    e.stopPropagation();
    setProfileDropdownOpen(false);
  };

  // Handle mobile menu item click
  const handleMobileMenuItemClick = (e: React.MouseEvent) => {
    // Only stop propagation to prevent the menu from closing
    // but don't prevent default to allow navigation
    e.stopPropagation();
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className='w-full py-4 px-4 md:px-6 sticky top-0 z-50 dark:bg-black bg-white/80 backdrop-blur-md dark:border-b dark:border-gray-800/30 border-b border-gray-200/30'>
      <div className='max-w-screen-xl mx-auto relative'>
        {/* Desktop navbar */}
        <div className='flex items-center justify-between'>
          <Link href='/' className='flex items-center space-x-2'>
            <div className='rounded-full flex items-center justify-center'>
              <Image
                src='/images/logo.png'
                alt='OnePlace Logo'
                width={24}
                height={24}
                className='object-contain'
                style={{ borderRadius: '50%' }}
              />
            </div>
            <span className='text-xl dark:text-white text-gray-900 font-medium'>OnePlace</span>
          </Link>

          {/* Desktop navigation links */}
          <div className='hidden md:flex items-center space-x-8'>
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors flex items-center space-x-1 ${
                  pathname === link.href ? 'text-blue-500' : 'dark:text-gray-300 text-gray-600 hover:text-blue-500'
                }`}>
                <link.icon size={16} className='opacity-70' />
                <span>{link.title}</span>
              </Link>
            ))}
          </div>

          {/* Auth / CTA buttons */}
          <div className='flex items-center space-x-3'>  
            <ThemeToggle />

            {loading ? (
              <div className='h-9 w-24 dark:bg-gray-800 bg-gray-200 animate-pulse rounded-full'></div>
            ) : user ? (
              <div className='relative' ref={profileDropdownRef}>
                <Button
                  variant='outline'
                  className='rounded-full dark:bg-gray-900 dark:border-gray-700 bg-white border-gray-300 dark:hover:bg-gray-800 hover:bg-gray-100 dark:hover:border-gray-600 hover:border-gray-400 dark:text-white text-gray-900 flex items-center hover:cursor-pointer'
                  onClick={handleProfileDropdownToggle}>
                  <span className='mr-2'>Hi, {profile?.name || user.email?.split('@')[0]}</span>
                  <ChevronDown className='h-4 w-4' />
                </Button>

                {/* Profile dropdown */}
                {profileDropdownOpen && (
                  <div className='absolute right-0 mt-2 w-48 dark:bg-gray-900 bg-white rounded-lg shadow-lg py-2 z-50 dark:border dark:border-gray-800 border border-gray-200'>
                    <Link
                      href='/subscriptions'
                      className='flex items-center px-4 py-2 text-sm dark:text-gray-300 text-gray-700 dark:hover:bg-gray-800 hover:bg-gray-100 hover:cursor-pointer'
                      onClick={handleDropdownItemClick}>
                      <BookOpen className='mr-2 h-4 w-4 text-blue-400' />
                      My Subscriptions
                    </Link>
                    <button
                      onClick={handleLogout}
                      className='flex items-center w-full text-left px-4 py-2 text-sm text-red-500 dark:hover:bg-gray-800 hover:bg-gray-100 hover:cursor-pointer'>
                      <LogOut className='mr-2 h-4 w-4' />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href='/login'>
                  <Button
                    variant='outline'
                    className='rounded-full dark:border-gray-700 dark:bg-gray-900 border-gray-300 bg-white dark:hover:bg-gray-800 hover:bg-gray-100 dark:text-white text-gray-900'>
                    Login
                  </Button>
                </Link>
                <Link href='/signup'>
                  <Button className='bg-blue-600 hover:bg-blue-700 text-white rounded-full'>
                    Sign Up
                  </Button>
                </Link>
              </>
            )}

            {/* Mobile menu button */}
            <Button
              variant='outline'
              size='icon'
              aria-label='Toggle mobile menu'
              className='md:hidden rounded-full dark:border-gray-700 border-gray-300 dark:bg-gray-900 bg-white dark:text-white text-gray-900'
              onClick={handleMobileMenuToggle}>
              {isMobileMenuOpen ? <X className='h-5 w-5' /> : <Menu className='h-5 w-5' />}
            </Button>
          </div>
        </div>

        {/* Mobile menu dropdown - matching profile dropdown style */}
        {isMobileMenuOpen && (
          <div
            ref={mobileMenuRef}
            className='md:hidden absolute top-full right-0 mt-2 w-56 dark:bg-gray-900 bg-white rounded-lg shadow-lg py-2 z-[200] dark:border dark:border-gray-800 border border-gray-200'>
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className='flex items-center px-4 py-2 text-sm dark:text-gray-300 text-gray-700 dark:hover:bg-gray-800 hover:bg-gray-100 hover:cursor-pointer'
                onClick={handleMobileMenuItemClick}>
                <link.icon className='mr-2 h-4 w-4 text-blue-400' />
                {link.title}
              </Link>
            ))}

            {user && (
              <Link
                href='/subscriptions'
                className='flex items-center px-4 py-2 text-sm dark:text-gray-300 text-gray-700 dark:hover:bg-gray-800 hover:bg-gray-100 hover:cursor-pointer'
                onClick={handleMobileMenuItemClick}>
                <BookOpen className='mr-2 h-4 w-4 text-blue-400' />
                My Subscriptions
              </Link>
            )}

            {user && (
              <button
                onClick={handleLogout}
                className='flex items-center w-full text-left px-4 py-2 text-sm text-red-500 dark:hover:bg-gray-800 hover:bg-gray-100 hover:cursor-pointer'>
                <LogOut className='mr-2 h-4 w-4' />
                Logout
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
