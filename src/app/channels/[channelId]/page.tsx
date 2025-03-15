// src/app/channels/[channelId]/page.tsx - Channel-specific page displaying channel details and summaries
import { SubscribeButton } from '@/components/SubscribeButton';
import SummaryCard from '@/components/SummaryCard';
import Image from 'next/image';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { unstable_cache } from 'next/cache';

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
            <SubscribeButton channelId={channelId} initialIsSubscribed={isSubscribed} />
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
