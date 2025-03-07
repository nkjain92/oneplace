'use client';

// src/app/channels/[channelId]/page.tsx - Displays all summaries for a specific channel

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { SubscribeButton } from '@/components/SubscribeButton';
import SummaryCard from '@/components/SummaryCard';
import { useAuthStore } from '@/store/authStore';

// Define interface for summary object
interface Summary {
  id: string;
  title: string;
  content_created_at: string;
  publisher_name: string;
  publisher_id: string;
  summary: string;
  content_id: string;
  tags?: string[];
  featured_names?: string[];
}

export default function ChannelPage() {
  const params = useParams();
  const channelId = params.channelId as string;
  const { user } = useAuthStore();

  const [channel, setChannel] = useState<{ name: string; description: string | null } | null>(null);
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    async function fetchChannelData() {
      if (!channelId) return;

      try {
        setLoading(true);

        // Fetch channel details
        const { data: channelData, error: channelError } = await supabase
          .from('channels')
          .select('name, description')
          .eq('id', channelId)
          .single();

        if (channelError) {
          throw new Error(`Error fetching channel: ${channelError.message}`);
        }

        // Fetch summaries for this channel
        const { data: summariesData, error: summariesError } = await supabase
          .from('summaries')
          .select('*')
          .eq('publisher_id', channelId)
          .order('content_created_at', { ascending: false });

        if (summariesError) {
          throw new Error(`Error fetching summaries: ${summariesError.message}`);
        }

        // Check if user is subscribed to this channel
        let subscriptionStatus = false;
        if (user) {
          const { data: subscriptionData, error: subscriptionError } = await supabase
            .from('subscriptions')
            .select('id')
            .eq('user_id', user.id)
            .eq('channel_id', channelId)
            .maybeSingle();

          if (!subscriptionError && subscriptionData) {
            subscriptionStatus = true;
          }
        }

        setChannel(channelData);
        setSummaries(summariesData || []);
        setIsSubscribed(subscriptionStatus);
        setError(null);
      } catch (err) {
        console.error('Error fetching channel data:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchChannelData();
  }, [channelId, user]);

  if (loading) {
    return (
      <div className='p-6 max-w-7xl mx-auto'>
        {/* Skeleton loader for channel header */}
        <div className='h-10 w-80 bg-gray-200 rounded-md mb-8 animate-pulse'></div>

        {/* Skeleton loaders for summary cards */}
        <div className='grid grid-cols-1 gap-6'>
          {[...Array(3)].map((_, i) => (
            <div key={i} className='h-48 bg-gray-200 rounded-lg animate-pulse'></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='p-6 max-w-7xl mx-auto'>
        <div className='bg-red-50 text-red-600 p-4 rounded-md'>Error: {error}</div>
      </div>
    );
  }

  return (
    <div className='p-6 bg-gray-50 min-h-screen'>
      <div className='max-w-7xl mx-auto'>
        {/* Channel header */}
        <div className='p-6 mb-8 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg shadow-sm'>
          <div className='flex items-center justify-between'>
            <h1 className='text-2xl font-bold text-gray-900'>{channel?.name}</h1>
            <SubscribeButton channelId={channelId} />
          </div>
          {channel?.description && <p className='mt-2 text-gray-600'>{channel.description}</p>}
        </div>

        {/* Summaries list */}
        <div className='grid grid-cols-1 gap-6'>
          {summaries.length > 0 ? (
            summaries.map(summary => (
              <SummaryCard
                key={summary.id}
                title={summary.title}
                date={summary.content_created_at}
                channelName={channel?.name || summary.publisher_name}
                channelId={channelId}
                isSubscribed={isSubscribed}
                summary={summary.summary}
                tags={summary.tags || []}
                peopleMentioned={summary.featured_names || []}
                videoId={summary.content_id}
              />
            ))
          ) : (
            <div className='bg-white p-8 rounded-lg text-center'>
              <p className='text-gray-600'>No summaries available for this channel yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
