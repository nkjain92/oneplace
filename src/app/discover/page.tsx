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
  thumbnail?: string;
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

  if (isLoading) return <div className='text-center py-8 text-gray-400'>Loading...</div>;
  if (error) return <div className='text-center py-8 text-red-400'>Error: {error}</div>;

  return (
    <div className='relative py-16 px-6'>
      {/* Grid background */}
      <div className='absolute inset-0 bg-grid-small-white/[0.1] -z-10' />
      {/* Gradient overlay */}
      <div className='absolute inset-0 bg-gradient-to-b from-black/10 via-black to-black -z-10' />

      {/* Floating gradient orbs - Vercel style */}
      <div className='absolute top-40 -left-64 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-5xl opacity-10 animate-blob'></div>
      <div className='absolute bottom-20 right-20 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-5xl opacity-10 animate-blob animation-delay-2000'></div>

      <div className='max-w-7xl mx-auto'>
        <div className='mb-12'>
          <h1 className='text-4xl font-bold text-white mb-4 tracking-tight'>Discover Channels</h1>
          <p className='text-xl text-gray-400 max-w-3xl'>
            Find your favorite podcast channels and subscribe to get daily summaries of their latest
            content.
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {channels.map(channel => (
            <ChannelCard
              key={channel.id}
              id={channel.id}
              name={channel.name}
              description={channel.description}
              image={channel.image}
              thumbnail={channel.thumbnail}
              subscriberCount={channel.subscriberCount}
              contentCount={channel.contentCount}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
