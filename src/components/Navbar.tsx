'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { signOut } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetTitle } from '@/components/ui/sheet';
import { Menu, ChevronDown, X } from 'lucide-react';

export default function Navbar() {
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
            <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='ghost'
                  className='text-white hover:text-blue-100 transition-colors'>
                  <span className='mr-2'>Hi, {profile?.name || user.email}</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-48'>
                <DropdownMenuItem asChild>
                  <Link href='/subscriptions'>My Subscriptions</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            // Logged out state
            <div className='flex items-center space-x-4'>
              <Button variant='ghost' asChild>
                <Link href='/login' className='text-white hover:text-blue-100 transition-colors'>
                  Login
                </Link>
              </Button>
              <Button variant='default' asChild>
                <Link
                  href='/signup'
                  className='bg-white text-blue-600 hover:bg-blue-50 transition-colors'>
                  Sign Up
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant='ghost' size='icon' className='md:hidden text-white'>
              <Menu className='h-6 w-6' />
              <span className='sr-only'>{isMobileMenuOpen ? 'Close menu' : 'Open menu'}</span>
            </Button>
          </SheetTrigger>
          <SheetContent side='right' className='bg-blue-600 p-0'>
            <SheetTitle className='sr-only'>Navigation Menu</SheetTitle>
            <div className='flex flex-col h-full text-white p-4'>
              <div className='flex flex-col space-y-4'>
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
                    <Button
                      variant='ghost'
                      className='text-white hover:text-blue-100 transition-colors text-left justify-start p-0'
                      onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                      }}>
                      Logout
                    </Button>
                  </div>
                ) : (
                  <div className='flex flex-col space-y-2 border-t border-blue-500 pt-2'>
                    <Link
                      href='/login'
                      className='text-white hover:text-blue-100 transition-colors'
                      onClick={() => setIsMobileMenuOpen(false)}>
                      Login
                    </Link>
                    <Button variant='default' asChild className='inline-block w-fit'>
                      <Link
                        href='/signup'
                        className='bg-white text-blue-600 hover:bg-blue-50 py-2 px-4 rounded-md transition-colors'
                        onClick={() => setIsMobileMenuOpen(false)}>
                        Sign Up
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
