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
  const {} = useSubscriptionStore();

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
        <div className='h-10 w-80 bg-gray-800 rounded-md mb-8 animate-pulse'></div>
        <div className='grid grid-cols-1 gap-6'>
          {[...Array(3)].map((_, i) => (
            <div key={i} className='h-48 bg-gray-800 rounded-lg animate-pulse'></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='p-6 max-w-7xl mx-auto'>
        <div className='bg-red-900/20 text-red-400 p-4 rounded-md border border-red-800'>
          Error: {error}
        </div>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className='p-6 max-w-7xl mx-auto'>
        <div className='bg-amber-900/20 text-amber-400 p-4 rounded-md border border-amber-800'>
          Channel not found
        </div>
      </div>
    );
  }

  return (
    <div className='relative min-h-screen bg-black'>
      {/* Grid background */}
      <div className='absolute inset-0 bg-grid-small-white/[0.1] -z-10' />

      {/* Floating gradient orbs - Vercel style */}
      <div className='absolute top-40 -right-64 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-5xl opacity-10 animate-blob animation-delay-4000'></div>
      <div className='absolute bottom-20 -left-64 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-5xl opacity-10 animate-blob'></div>

      <div className='max-w-7xl mx-auto p-6'>
        <div className='mb-10'>
          <div className='flex items-center justify-between flex-wrap gap-4 bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800 mb-8'>
            <div className='flex items-center gap-4'>
              {channel.thumbnail && (
                <div className='relative h-16 w-16 rounded-full overflow-hidden border border-gray-700 bg-gray-800'>
                  <Image src={channel.thumbnail} alt={channel.name} fill className='object-cover' />
                </div>
              )}
              <div>
                <h1 className='text-2xl font-bold text-white'>{channel.name}</h1>
                {channel.description && (
                  <p className='text-gray-400 mt-1 max-w-2xl'>{channel.description}</p>
                )}
              </div>
            </div>
            <SubscribeButton channelId={channelId} />
          </div>

          <h2 className='text-xl font-semibold text-white mb-6'>Recent Summaries</h2>

          {summaries.length > 0 ? (
            <div className='space-y-6'>
              {summaries.map(summary => (
                <SummaryCard
                  key={summary.id}
                  title={summary.title}
                  date={summary.content_created_at}
                  channelName={summary.publisher_name}
                  channelId={summary.publisher_id}
                  summary={summary.summary}
                  tags={summary.tags || []}
                  peopleMentioned={summary.featured_names || []}
                  videoId={summary.content_id}
                />
              ))}
            </div>
          ) : (
            <div className='bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800 text-center'>
              <p className='text-gray-400'>No summaries available for this channel yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
