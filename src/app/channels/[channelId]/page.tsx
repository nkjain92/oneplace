'use client';

// src/app/channels/[channelId]/page.tsx - Channel-specific page displaying channel details and summaries
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { SubscribeButton } from '@/components/SubscribeButton';
import SummaryCard from '@/components/SummaryCard';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import Image from 'next/image';

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

  // Get subscription status from the store
  const { subscribedChannels } = useSubscriptionStore();
  const isSubscribed = subscribedChannels.includes(channelId);

  const [channel, setChannel] = useState<{
    name: string;
    description: string | null;
    thumbnail?: string;
  } | null>(null);
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchChannelData() {
      if (!channelId) return;

      try {
        setLoading(true);

        // Fetch channel details
        const { data: channelData, error: channelError } = await supabase
          .from('channels')
          .select('name, description, thumbnail')
          .eq('id', channelId)
          .single();

        if (channelError) throw new Error(`Error fetching channel: ${channelError.message}`);

        // Fetch summaries
        const { data: summariesData, error: summariesError } = await supabase
          .from('summaries')
          .select('*')
          .eq('publisher_id', channelId)
          .order('content_created_at', { ascending: false });

        if (summariesError) throw new Error(`Error fetching summaries: ${summariesError.message}`);

        setChannel(channelData);
        setSummaries(summariesData || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching channel data:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchChannelData();
  }, [channelId]);

  if (loading) {
    return (
      <div className='p-6 max-w-7xl mx-auto'>
        <div className='h-10 w-80 bg-gray-200 rounded-md mb-8 animate-pulse'></div>
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
        {/* Channel header with subscription status */}
        <div className='bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-8 rounded-lg shadow-md mb-6 relative overflow-hidden'>
          {channel?.thumbnail && (
            <div className='absolute inset-0 opacity-20'>
              <Image src={channel.thumbnail} alt={channel.name} fill className='object-cover' />
            </div>
          )}
          <div className='relative z-10'>
            <h1 className='text-3xl font-bold'>{channel?.name}</h1>
            {channel?.description && <p className='mt-2 text-white/80'>{channel.description}</p>}
          </div>
          <div className='mt-4 flex justify-end relative z-10'>
            <SubscribeButton channelId={channelId} />
          </div>
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
