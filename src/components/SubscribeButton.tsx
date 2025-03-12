// src/components/SubscribeButton.tsx - Button component for subscribing to channels with authentication handling
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
            ? 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300'
            : 'bg-[#4263eb] hover:bg-[#3b5bdb] text-white shadow-sm'
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
        <p className='text-red-500 text-xs mt-1 bg-red-50 px-2 py-1 rounded-md border border-red-100'>
          {error}
        </p>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className='bg-white rounded-xl border border-gray-100 shadow-lg'>
          <DialogHeader>
            <DialogTitle className='text-[#4263eb] text-xl font-bold'>
              Sign in to subscribe
            </DialogTitle>
            <DialogDescription className='text-gray-600 mt-2'>
              Please sign in or create an account to subscribe to channels and get updates.
            </DialogDescription>
          </DialogHeader>
          <div className='flex space-x-4 mt-2'>
            <Link href='/login' className='flex-1'>
              <Button className='bg-[#4263eb] hover:bg-[#3b5bdb] text-white w-full'>Sign In</Button>
            </Link>
            <Link href='/signup' className='flex-1'>
              <Button variant='outline' className='border-gray-200 hover:bg-gray-50 w-full'>
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
