'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { signOut } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetTitle,
  SheetFooter,
  SheetHeader,
} from '@/components/ui/sheet';
import { Menu, ChevronDown } from 'lucide-react';

export default function Navbar() {
  const { user, profile, loading } = useAuthStore();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Handle logout action
  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav className='fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 shadow-sm'>
      <div className='container mx-auto px-4'>
        <div className='flex h-16 items-center justify-between'>
          {/* Logo */}
          <Link href='/' className='flex items-center space-x-2'>
            <span className='text-xl font-bold text-[#4263eb]'>GetSmart</span>
          </Link>

          {/* Navigation Links */}
          <div className='hidden md:flex space-x-8'>
            <Link
              href='/'
              className={`text-sm font-medium transition-colors ${
                pathname === '/' ? 'text-[#4263eb]' : 'text-gray-600 hover:text-[#4263eb]'
              }`}>
              Home
            </Link>
            <Link
              href='/discover'
              className={`text-sm font-medium transition-colors ${
                pathname === '/discover' ? 'text-[#4263eb]' : 'text-gray-600 hover:text-[#4263eb]'
              }`}>
              Discover
            </Link>
            <Link
              href='/history'
              className={`text-sm font-medium transition-colors ${
                pathname === '/history' ? 'text-[#4263eb]' : 'text-gray-600 hover:text-[#4263eb]'
              }`}>
              History
            </Link>
          </div>

          {/* Authentication Buttons */}
          <div className='flex items-center space-x-4'>
            {/* Show skeleton loaders during auth state check */}
            {loading ? (
              <div className='flex space-x-4'>
                <div className='h-9 w-20 bg-gray-100 animate-pulse rounded-md'></div>
                <div className='h-9 w-20 bg-gray-100 animate-pulse rounded-md'></div>
              </div>
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='outline' className='border-gray-200 hover:bg-gray-50'>
                    <span className='mr-2'>Hi, {profile?.name || user.email}</span>
                    <ChevronDown className='h-4 w-4' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                  <DropdownMenuItem>
                    <Link href='/subscriptions' className='flex w-full'>
                      My Subscriptions
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link href='/login'>
                  <Button variant='outline' className='border-gray-200 hover:bg-gray-50'>
                    Login
                  </Button>
                </Link>
                <Link href='/signup'>
                  <Button className='bg-[#4263eb] hover:bg-[#3b5bdb] text-white'>Sign Up</Button>
                </Link>
              </>
            )}

            {/* Mobile menu button */}
            <Button
              variant='outline'
              size='icon'
              className='md:hidden border-gray-200'
              onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className='h-6 w-6' />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side='right'>
          <SheetHeader>
            <SheetTitle className='text-[#4263eb]'>Menu</SheetTitle>
          </SheetHeader>
          <div className='grid gap-4 py-4'>
            <Link
              href='/'
              className={`px-4 py-2 rounded-md ${
                pathname === '/' ? 'bg-blue-50 text-[#4263eb]' : 'hover:bg-gray-50'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}>
              Home
            </Link>
            <Link
              href='/discover'
              className={`px-4 py-2 rounded-md ${
                pathname === '/discover' ? 'bg-blue-50 text-[#4263eb]' : 'hover:bg-gray-50'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}>
              Discover
            </Link>
            <Link
              href='/history'
              className={`px-4 py-2 rounded-md ${
                pathname === '/history' ? 'bg-blue-50 text-[#4263eb]' : 'hover:bg-gray-50'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}>
              History
            </Link>
            {user && (
              <Link
                href='/subscriptions'
                className={`px-4 py-2 rounded-md ${
                  pathname === '/subscriptions' ? 'bg-blue-50 text-[#4263eb]' : 'hover:bg-gray-50'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}>
                My Subscriptions
              </Link>
            )}
          </div>
          <SheetFooter>
            {!user && (
              <div className='flex flex-col space-y-2 w-full'>
                <Link href='/login' onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className='w-full' variant='outline'>
                    Login
                  </Button>
                </Link>
                <Link href='/signup' onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className='w-full bg-[#4263eb] hover:bg-[#3b5bdb] text-white'>
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
            {user && (
              <Button variant='destructive' className='w-full' onClick={handleLogout}>
                Logout
              </Button>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
