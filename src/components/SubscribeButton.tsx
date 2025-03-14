// src/components/SubscribeButton.tsx - Button component for subscribing to channels with authentication handling
'use client'
import { useState, memo } from 'react';
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
}

const SubscribeButton = memo(({ channelId }: SubscribeButtonProps) => {
  const { user } = useAuthStore();
  const { subscribedChannels, subscribe, unsubscribe, isChannelLoading, error } =
    useSubscriptionStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const isSubscribed = subscribedChannels.includes(channelId);
  const isLoading = isChannelLoading(channelId);

  const handleClick = async () => {
    if (!user) {
      setIsDialogOpen(true);
      return;
    }
    if (isSubscribed) {
      await unsubscribe(channelId);
    } else {
      await subscribe(channelId);
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
            ? 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700 hover:text-white hover:border-gray-600'
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
            Subscribed
          </span>
        ) : (
          <span className='flex items-center'>
            <BellRing className='h-3.5 w-3.5 mr-1.5' />
            Subscribe
          </span>
        )}
      </Button>

      {error && !isLoading && (
        <p className='text-red-400 text-xs mt-1 bg-red-900/20 px-2 py-1 rounded-md border border-red-800/30'>
          {error}
        </p>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className='bg-gray-900 rounded-xl border border-gray-800 shadow-xl'>
          <DialogHeader>
            <DialogTitle className='text-blue-400 text-xl font-bold'>
              Sign in to subscribe
            </DialogTitle>
            <DialogDescription className='text-gray-400 mt-2'>
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
                className='border-gray-700 hover:bg-gray-800 text-gray-300 hover:text-white w-full'>
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
