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
  image?: string;
  thumbnail?: string;
  subscriberCount?: number;
  contentCount?: number;
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
    return (
      <div className='min-h-[calc(100vh-64px)] bg-black flex items-center justify-center'>
        <div className='space-y-4'>
          {[...Array(3)].map((_, i) => (
            <div key={i} className='h-20 w-72 bg-gray-800 rounded-lg animate-pulse'></div>
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className='min-h-[calc(100vh-64px)] bg-black'>
        <div className='container mx-auto px-4 py-16 text-center'>
          <h1 className='text-3xl font-bold text-white mb-6'>My Subscriptions</h1>
          <div className='max-w-lg mx-auto bg-gray-900 border border-gray-800 rounded-lg p-6 shadow-lg'>
            <p className='text-gray-300 mb-4'>Please sign in to view your subscriptions.</p>
            <div className='flex justify-center space-x-4'>
              <a
                href='/login'
                className='inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200'>
                Sign In
              </a>
              <a
                href='/signup'
                className='inline-flex items-center justify-center px-4 py-2 border border-gray-700 text-sm font-medium rounded-md shadow-sm text-gray-300 bg-transparent hover:bg-gray-800 transition-colors duration-200'>
                Sign Up
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-[calc(100vh-64px)] bg-black'>
      <div className='container mx-auto px-4 py-12'>
        <div className='relative'>
          {/* Gradient Orbs */}
          <div className='absolute top-[-150px] left-[-100px] w-[300px] h-[300px] bg-blue-600/20 rounded-full blur-[100px] opacity-50'></div>
          <div className='absolute top-[50px] right-[-100px] w-[250px] h-[250px] bg-purple-600/20 rounded-full blur-[100px] opacity-30'></div>

          <h1 className='text-3xl font-bold text-white mb-8 relative z-10'>My Subscriptions</h1>

          {channels.length > 0 ? (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10'>
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
          ) : (
            <div className='text-center py-12 bg-gray-900 border border-gray-800 rounded-xl shadow-lg relative z-10'>
              <p className='text-gray-300 mb-4'>You haven&apos;t subscribed to any channels yet.</p>
              <a
                href='/discover'
                className='inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200'>
                Discover Channels
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
