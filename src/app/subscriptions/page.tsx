// src/app/subscriptions/page.tsx - User subscriptions page displaying subscribed channels
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { ChannelCard } from '@/components/ChannelCard';

interface Channel {
  id: string;
  name: string;
  description: string;
}

export default function SubscriptionsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [channels, setChannels] = useState<Channel[]>([]);
  const { user } = useAuthStore();
  const { fetchSubscriptions } = useSubscriptionStore();
  const dataFetchedRef = useRef(false);

  useEffect(() => {
    if (!dataFetchedRef.current && user) {
      dataFetchedRef.current = true;

      const fetchData = async () => {
        try {
          await fetchSubscriptions();
          const latestSubscribedChannels = useSubscriptionStore.getState().subscribedChannels;

          const response = await fetch('/api/subscribed-channels', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ channelIds: latestSubscribedChannels }),
          });
          if (!response.ok) throw new Error('Failed to fetch subscribed channels');

          const subscribedChannelsData: Channel[] = await response.json();
          setChannels(subscribedChannelsData);
        } catch (err) {
          console.error('Error fetching subscribed channels:', err);
          setChannels([]);
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
    } else if (!user) {
      setIsLoading(false);
    }
  }, [user, fetchSubscriptions]);

  if (isLoading) {
    return <div className='text-center py-8 text-gray-600'>Loading...</div>;
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      <h1 className='text-3xl font-bold text-gray-900 mb-6'>My Subscriptions</h1>
      {channels.length > 0 ? (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {channels.map(channel => (
            <ChannelCard
              key={channel.id}
              id={channel.id}
              name={channel.name}
              description={channel.description}
            />
          ))}
        </div>
      ) : (
        <div className='text-center py-8 text-gray-600'>
          You haven&apos;t subscribed to any channels yet.
        </div>
      )}
    </div>
  );
}
