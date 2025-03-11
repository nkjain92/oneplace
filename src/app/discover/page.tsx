// src/app/discover/page.tsx - Discovery page for exploring available channels
'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { ChannelCard } from '@/components/ChannelCard';

interface Channel {
  id: string;
  name: string;
  description: string;
  image?: string;
  subscriberCount?: number;
  contentCount?: number;
}

export default function DiscoverPage() {
  const { user } = useAuthStore();
  const { fetchSubscriptions } = useSubscriptionStore();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const response = await fetch('/api/channels');
        if (!response.ok) throw new Error('Failed to fetch channels');
        const data = await response.json();
        setChannels(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchChannels();
    if (user) fetchSubscriptions();
  }, [user, fetchSubscriptions]);

  if (isLoading) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <h1 className='text-3xl font-bold text-gray-900 mb-6'>Discover Channels</h1>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {[1, 2, 3, 4, 5, 6].map((_, index) => (
            <div key={index} className='h-64 bg-gray-100 rounded-xl animate-pulse'></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <h1 className='text-3xl font-bold text-gray-900 mb-6'>Discover Channels</h1>
        <div className='bg-red-50 text-red-600 p-4 rounded-md'>Error: {error}</div>
      </div>
    );
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      <h1 className='text-3xl font-bold text-gray-900 mb-3'>Discover Channels</h1>
      <p className='text-lg text-gray-600 mb-8'>
        Find and subscribe to your favorite content creators
      </p>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {channels.map(channel => (
          <ChannelCard
            key={channel.id}
            id={channel.id}
            name={channel.name}
            description={channel.description}
            image={channel.image}
            subscriberCount={channel.subscriberCount}
            contentCount={channel.contentCount}
          />
        ))}
      </div>
    </div>
  );
}
