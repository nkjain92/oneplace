// src/app/channels/[channelId]/page.tsx - Channel-specific page displaying channel details and summaries
import { SubscribeButton } from '@/components/SubscribeButton';
import SummaryCard from '@/components/SummaryCard';
import Image from 'next/image';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { unstable_cache } from 'next/cache';
import ChannelDescription from '@/components/ChannelDescription';

// Define interface for summary object
interface Summary {
  id: string;
  title: string;
  content_created_at: string;
  publisher_name: string;
  publisher_id: string;
  summary: string;
  content_id: string;
}

interface ChannelDetails {
  name: string;
  description: string | null;
  thumbnail?: string;
}

// Define params as a Promise type to match Next.js 15 requirements
type Params = Promise<{ channelId: string }>;

interface ChannelPageProps {
  params: Params;
}

export default async function ChannelPage({ params }: ChannelPageProps) {
  // Await the params Promise to get the channelId
  const { channelId } = await params;

  const supabase = await createSupabaseServerClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  // Check if user is subscribed to this channel
  const checkSubscription = unstable_cache(
    async (userId: string, channelId: string) => {
      if (!userId || !channelId) return false;
      
      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('user_id', userId)
          .eq('channel_id', channelId)
          .maybeSingle();
          
        if (error) throw error;
        return !!data; // Convert to boolean - true if data exists, false otherwise
      } catch (err) {
        console.error('Error checking subscription:', err);
        return false;
      }
    },
    ['channel-subscription-status'],
    { revalidate: 60 } // Revalidate every minute
  );
  
  // Determine if the user is subscribed to this channel
  const isSubscribed = user ? await checkSubscription(user.id, channelId) : false;

  async function fetchChannelData() {
    if (!channelId) return { channel: null, summaries: [], error: 'Channel ID missing' };

    try {
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

      return {
        channel: channelData as ChannelDetails | null,
        summaries: (summariesData as Summary[]) || [],
      };
    } catch (err) {
      console.error('Error fetching channel data:', err);
      return { channel: null, summaries: [], error: err instanceof Error ? err.message : 'An unknown error occurred' };
    }
  }

  const { channel, summaries, error } = await fetchChannelData();

  if (error) {
    return (
      <div className='p-6 max-w-7xl mx-auto'>
        <div className='dark:bg-red-900/20 bg-red-100 dark:text-red-400 text-red-600 p-4 rounded-md dark:border-red-800 border-red-300'>
          Error: {error}
        </div>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className='p-6 max-w-7xl mx-auto'>
        <div className='dark:bg-amber-900/20 bg-amber-100 dark:text-amber-400 text-amber-600 p-4 rounded-md dark:border-amber-800 border-amber-300'>
          Channel not found
        </div>
      </div>
    );
  }

  return (
    <div className='relative min-h-screen dark:bg-black bg-white'>
      {/* Grid background */}
      <div className='absolute inset-0 dark:bg-grid-small-white/[0.1] bg-grid-small-black/[0.05] -z-10' />

      {/* Floating gradient orbs - Vercel style */}
      <div className='absolute top-40 -right-64 w-96 h-96 dark:bg-blue-500 bg-blue-300 rounded-full mix-blend-multiply filter blur-5xl dark:opacity-10 opacity-20 animate-blob animation-delay-4000'></div>
      <div className='absolute bottom-20 -left-64 w-96 h-96 dark:bg-purple-500 bg-purple-300 rounded-full mix-blend-multiply filter blur-5xl dark:opacity-10 opacity-20 animate-blob'></div>

      <div className='max-w-7xl mx-auto p-6'>
        <div className='mb-10'>
          <div className='flex items-center justify-between flex-wrap gap-4 dark:bg-gray-900/50 bg-gray-100/70 backdrop-blur-sm rounded-xl p-6 dark:border-gray-800 border-gray-300 mb-8'>
            <div className='flex items-center gap-4'>
              {channel.thumbnail && (
                <div className='relative h-16 w-16 rounded-full overflow-hidden dark:border-gray-700 border-gray-300 dark:bg-gray-800 bg-gray-200 flex-shrink-0'>
                  <Image src={channel.thumbnail} alt={channel.name} fill className='object-cover' sizes="64px" />
                </div>
              )}
              <div>
                <h1 className='text-2xl font-bold dark:text-white text-gray-900'>{channel.name}</h1>
                {channel.description && (
                  <ChannelDescription description={channel.description} />
                )}
              </div>
            </div>
            <SubscribeButton channelId={channelId} initialIsSubscribed={isSubscribed} />
          </div>

          <h2 className='text-xl font-semibold dark:text-white text-gray-900 mb-6'>Recent Summaries</h2>

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
                  videoId={summary.content_id}
                />
              ))}
            </div>
          ) : (
            <div className='dark:bg-gray-900/50 bg-gray-100/70 backdrop-blur-sm rounded-xl p-6 dark:border-gray-800 border-gray-300 text-center'>
              <p className='dark:text-gray-400 text-gray-600'>No summaries available for this channel yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
