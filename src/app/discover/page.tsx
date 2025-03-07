'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { ChannelCard } from '@/components/ChannelCard';

interface Channel {
  id: string;
  name: string;
  description: string;
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

  if (isLoading) return <div className='text-center py-8 text-gray-600'>Loading...</div>;
  if (error) return <div className='text-center py-8 text-red-500'>Error: {error}</div>;

  return (
    <div className='container mx-auto px-4 py-8'>
      <h1 className='text-3xl font-bold text-gray-900 mb-6'>Discover Channels</h1>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {channels.map(channel => (
          <ChannelCard key={channel.id} {...channel} />
        ))}
      </div>
    </div>
  );
}
