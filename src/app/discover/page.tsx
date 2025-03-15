// src/app/discover/page.tsx - Discovery page for exploring available channels
import { ChannelCard } from '@/components/ChannelCard';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { unstable_cache } from 'next/cache';

interface Channel {
  id: string;
  name: string;
  description: string;
  image?: string;
  thumbnail?: string;
  subscriberCount?: number;
  contentCount?: number;
}

export default async function DiscoverPage() {
  const supabase = await createSupabaseServerClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  // Cache the channel fetching function
  const fetchChannels = unstable_cache(
    async () => {
      try {
        const response = await supabase
          .from('channels')
          .select('id, name, description, thumbnail');
        if (response.error) throw new Error('Failed to fetch channels');
        return response.data as Channel[];
      } catch (err) {
        console.error('Error fetching channels:', err);
        return []; 
      }
    },
    ['discover-channels'],
    { revalidate: 3600 } // Revalidate every hour
  );
  
  // Cache the subscriptions fetching function
  const fetchSubscriptions = unstable_cache(
    async (userId: string) => {
      if (!userId) return [];
      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('channel_id')
          .eq('user_id', userId);
        if (error) throw error;
        return data.map(sub => sub.channel_id);
      } catch (err) {
        console.error('Error fetching subscriptions:', err);
        return [];
      }
    },
    ['user-subscriptions'],
    { revalidate: 60 } // Revalidate every minute
  );
  
  // Fetch channels and subscriptions in parallel
  const [channels, subscribedChannelIds] = await Promise.all([
    fetchChannels(),
    user ? fetchSubscriptions(user.id) : Promise.resolve([])
  ]);

  return (
    <div className='relative py-16 px-6 dark:bg-black bg-white min-h-[calc(100vh-64px)]'>
      {/* Grid background */}
      <div className='absolute inset-0 dark:bg-grid-small-white/[0.1] bg-grid-small-black/[0.05] -z-10' />
      {/* Gradient overlay */}
      <div className='absolute inset-0 dark:bg-gradient-to-b dark:from-black/10 dark:via-black dark:to-black bg-gradient-to-b from-white/80 via-white to-white -z-10' />

      {/* Floating gradient orbs - Vercel style */}
      <div className='absolute top-40 -left-64 w-96 h-96 dark:bg-blue-500 bg-blue-300 rounded-full mix-blend-multiply filter blur-5xl dark:opacity-10 opacity-20 animate-blob'></div>
      <div className='absolute bottom-20 right-20 w-96 h-96 dark:bg-purple-500 bg-purple-300 rounded-full mix-blend-multiply filter blur-5xl dark:opacity-10 opacity-20 animate-blob animation-delay-2000'></div>

      <div className='max-w-7xl mx-auto'>
        <div className='mb-12'>
          <h1 className='text-4xl font-bold dark:text-white text-gray-900 mb-4 tracking-tight'>Discover Channels</h1>
          <p className='text-xl dark:text-gray-400 text-gray-600 max-w-3xl'>
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
              isSubscribed={subscribedChannelIds.includes(channel.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
