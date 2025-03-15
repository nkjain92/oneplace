// src/components/SubscribeButton.tsx - Button component for subscribing to channels with authentication handling
'use client'
import { useState, memo, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Link from 'next/link';
import { BellOff, BellRing, Loader2 } from 'lucide-react';

interface SubscribeButtonProps {
  channelId: string;
  initialIsSubscribed?: boolean;
}

const SubscribeButton = memo(({ channelId, initialIsSubscribed = false }: SubscribeButtonProps) => {
  const { user } = useAuthStore();
  const { subscribedChannels, subscribe, unsubscribe, isChannelLoading, error, fetchSubscriptions } =
    useSubscriptionStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(initialIsSubscribed);
  const isLoading = isChannelLoading(channelId);
  
  // Initialize subscription state from both props and store
  useEffect(() => {
    // Update local state based on either the initialIsSubscribed prop or the store state
    setIsSubscribed(initialIsSubscribed || subscribedChannels.includes(channelId));
  }, [channelId, initialIsSubscribed, subscribedChannels]);
  
  // Fetch subscriptions only once when the component mounts and user exists
  useEffect(() => {
    // Only fetch if user is logged in and we haven't already fetched
    if (user && subscribedChannels.length === 0) {
      fetchSubscriptions();
    }
  }, [user, subscribedChannels.length, fetchSubscriptions]);

  const handleClick = async () => {
    if (!user) {
      setIsDialogOpen(true);
      return;
    }
    if (isSubscribed) {
      await unsubscribe(channelId);
      setIsSubscribed(false);
    } else {
      await subscribe(channelId);
      setIsSubscribed(true);
    }
  };

  return (
    <>
      <Button
        onClick={handleClick}
        disabled={isLoading}
        variant={isSubscribed ? 'outline' : 'default'}
        size='sm'
        className={`rounded-full px-4 py-1 h-9 transition-all duration-200 hover:cursor-pointer ${
          isSubscribed
            ? 'dark:bg-gray-800 bg-gray-100 dark:text-gray-300 text-gray-600 dark:border-gray-700 border-gray-300 dark:hover:bg-gray-700 hover:bg-gray-200 dark:hover:text-white hover:text-gray-800 dark:hover:border-gray-600 hover:border-gray-400'
            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
        }`}>
        {isLoading ? (
          <span className='flex items-center'>
            <Loader2 className='h-3.5 w-3.5 mr-1.5 animate-spin' />
            Processing...
          </span>
        ) : isSubscribed ? (
          <span className='flex items-center'>
            <BellOff className='h-3.5 w-3.5 mr-1.5' />
            Unsubscribe
          </span>
        ) : (
          <span className='flex items-center'>
            <BellRing className='h-3.5 w-3.5 mr-1.5' />
            Subscribe
          </span>
        )}
      </Button>

      {error && !isLoading && (
        <p className='text-red-400 text-xs mt-1 dark:bg-red-900/20 bg-red-50 px-2 py-1 rounded-md dark:border-red-800/30 border-red-200'>
          {error}
        </p>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className='dark:bg-gray-900 bg-white rounded-xl dark:border-gray-800 border-gray-200 shadow-xl'>
          <DialogHeader>
            <DialogTitle className='text-blue-500 dark:text-blue-400 text-xl font-bold'>
              Sign in to subscribe
            </DialogTitle>
            <DialogDescription className='dark:text-gray-400 text-gray-600 mt-2'>
              Please sign in or create an account to subscribe to channels and get updates.
            </DialogDescription>
          </DialogHeader>
          <div className='flex space-x-4 mt-2'>
            <Link href='/login' className='flex-1'>
              <Button className='bg-blue-600 hover:bg-blue-700 text-white w-full'>Sign In</Button>
            </Link>
            <Link href='/signup' className='flex-1'>
              <Button
                variant='outline'
                className='dark:border-gray-700 border-gray-300 dark:hover:bg-gray-800 hover:bg-gray-100 dark:text-gray-300 text-gray-700 dark:hover:text-white hover:text-gray-900 w-full'>
                Sign Up
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});

SubscribeButton.displayName = 'SubscribeButton';
export { SubscribeButton };
