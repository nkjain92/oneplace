// src/components/Navbar.tsx - Navigation component with Vellum-inspired design and authentication handling
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { signOut } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import {
  ChevronDown,
  X,
  Menu,
  History,
  Compass,
  Home,
  LogOut,
  User,
  BookOpen,
  MessageSquareDashed,
  BoxSelect,
} from 'lucide-react';

// Define navigation links and dropdown menus
const navLinks = [
  {
    title: 'Home',
    href: '/',
    icon: Home,
  },
  {
    title: 'Discover',
    href: '/discover',
    icon: Compass,
  },
  {
    title: 'History',
    href: '/history',
    icon: History,
  },
];

export default function Navbar() {
  const { user, profile, loading } = useAuthStore();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close profile dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle logout action
  const handleLogout = async () => {
    try {
      await signOut();
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

  return (
    <nav className='w-full py-4 px-4 md:px-6 sticky top-0 z-50 bg-transparent backdrop-blur-sm'>
      <div className='max-w-screen-xl mx-auto'>
        {/* Desktop navbar */}
        <div className='glass-card rounded-full px-4 py-2 flex items-center justify-between shadow-md'>
          <Link href='/' className='flex items-center space-x-2'>
            <div className='rounded-full flex items-center justify-center'>
              <BoxSelect size={18} className='text-gray-700' />
            </div>
            <span className='text-xl text-gray-700 font-medium'>OnePlace</span>
          </Link>

          {/* Desktop navigation links */}
          <div className='hidden md:flex items-center space-x-8'>
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors flex items-center space-x-1 ${
                  pathname === link.href ? 'text-primary' : 'text-gray-600 hover:text-primary'
                }`}>
                <link.icon size={16} className='opacity-70' />
                <span>{link.title}</span>
              </Link>
            ))}
          </div>

          {/* Auth / CTA buttons */}
          <div className='flex items-center space-x-4'>
            {loading ? (
              <div className='h-9 w-24 bg-gray-200 animate-pulse rounded-full'></div>
            ) : user ? (
              <div className='relative' ref={profileDropdownRef}>
                <Button
                  variant='outline'
                  className='rounded-full bg-white border-gray-200 hover:bg-gray-50 flex items-center'
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}>
                  <span className='mr-2'>Hi, {profile?.name || user.email?.split('@')[0]}</span>
                  <ChevronDown className='h-4 w-4' />
                </Button>

                {/* Profile dropdown */}
                {profileDropdownOpen && (
                  <div className='absolute right-0 mt-2 w-48 glass-card rounded-lg shadow-lg py-2 z-50'>
                    <Link
                      href='/subscriptions'
                      className='flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-primary/5'
                      onClick={() => setProfileDropdownOpen(false)}>
                      <BookOpen className='mr-2 h-4 w-4 text-primary/70' />
                      My Subscriptions
                    </Link>
                    <button
                      onClick={handleLogout}
                      className='flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50'>
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
                    className='rounded-full border-gray-200 hover:bg-gray-50'>
                    Login
                  </Button>
                </Link>
                <Link href='/signup' className='hidden md:block'>
                  <Button className='elegant-button'>Sign Up</Button>
                </Link>
              </>
            )}

            {/* Mobile menu button */}
            <Button
              variant='outline'
              size='icon'
              className='md:hidden rounded-full border-gray-200 bg-white'
              onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className='h-5 w-5' />
            </Button>
          </div>
        </div>

        {/* Mobile menu overlay */}
        {isMobileMenuOpen && (
          <div className='fixed inset-0 bg-white z-50 overflow-y-auto'>
            <div className='flex justify-between items-center p-4 border-b border-gray-100'>
              <Link
                href='/'
                className='flex items-center space-x-2'
                onClick={() => setIsMobileMenuOpen(false)}>
                <div className='rounded-full flex items-center justify-center'>
                  <BoxSelect size={18} className='text-gray-700' />
                </div>
                <span className='text-xl text-gray-700 font-medium'>OnePlace</span>
              </Link>
              <Button
                variant='outline'
                size='icon'
                className='rounded-full border-gray-200'
                onClick={() => setIsMobileMenuOpen(false)}>
                <X className='h-5 w-5' />
              </Button>
            </div>

            <div className='px-4 py-8'>
              <ul className='space-y-6'>
                {navLinks.map(link => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={`flex items-center text-lg font-medium ${
                        pathname === link.href ? 'text-primary' : 'text-gray-700'
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}>
                      <link.icon className='mr-3 h-5 w-5' />
                      {link.title}
                    </Link>
                  </li>
                ))}

                {user && (
                  <li>
                    <Link
                      href='/subscriptions'
                      className='flex items-center text-lg font-medium text-gray-700'
                      onClick={() => setIsMobileMenuOpen(false)}>
                      <BookOpen className='mr-3 h-5 w-5' />
                      My Subscriptions
                    </Link>
                  </li>
                )}
              </ul>

              <div className='mt-12'>
                {user ? (
                  <Button
                    variant='destructive'
                    className='w-full rounded-lg flex items-center justify-center'
                    onClick={handleLogout}>
                    <LogOut className='mr-2 h-4 w-4' />
                    Logout
                  </Button>
                ) : (
                  <div className='flex flex-col space-y-3'>
                    <Link href='/login' onClick={() => setIsMobileMenuOpen(false)}>
                      <Button className='w-full rounded-lg' variant='outline'>
                        Login
                      </Button>
                    </Link>
                    <Link href='/signup' onClick={() => setIsMobileMenuOpen(false)}>
                      <Button className='w-full elegant-button'>Sign Up</Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
