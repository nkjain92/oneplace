import { useState } from 'react';
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

interface SubscribeButtonProps {
  channelId: string;
}

export function SubscribeButton({ channelId }: SubscribeButtonProps) {
  const { user } = useAuthStore();
  const { subscribedChannels, subscribe, unsubscribe, isLoading } = useSubscriptionStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const isSubscribed = subscribedChannels.includes(channelId);

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
        className='bg-[#4263eb] hover:bg-[#3b5bdb] text-white'>
        {isSubscribed ? 'Unsubscribe' : 'Subscribe'}
      </Button>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className='bg-white rounded-xl border border-gray-100'>
          <DialogHeader>
            <DialogTitle className='text-[#4263eb]'>Sign in to subscribe</DialogTitle>
            <DialogDescription>
              Please sign in or create an account to subscribe to channels.
            </DialogDescription>
          </DialogHeader>
          <div className='flex space-x-4'>
            <Link href='/login'>
              <Button className='bg-[#4263eb] hover:bg-[#3b5bdb] text-white'>Sign In</Button>
            </Link>
            <Link href='/signup'>
              <Button variant='outline' className='border-gray-200 hover:bg-gray-50'>
                Sign Up
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
