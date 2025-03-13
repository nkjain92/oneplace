// src/app/page.tsx - Home page component for podcast summaries
'use client';

import { useState, useEffect, useCallback } from 'react';
import { YoutubeUrlInput } from '@/components/YoutubeUrlInput';
import SummaryCard from '@/components/SummaryCard';
import { SummaryProgressLoader } from '@/components/SummaryProgressLoader';
import { useAuthStore } from '@/store/authStore';
import { extractYouTubeVideoId } from '@/lib/utils/youtube';
import {
  addAnonymousGeneratedContentId,
  getAnonymousGeneratedContentIds,
} from '@/lib/localStorage';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { ArrowRight, Heart, Clock, Bell, Bookmark, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlowButton } from '@/components/ui/glow-button';
import { ChannelCard } from '@/components/ChannelCard';

// Types
interface SummaryData {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  featured_names: string[];
  publisher_name: string;
  publisher_id: string;
  content_created_at: string;
  videoId?: string;
  content_id?: string;
  status?: string;
}

interface ChannelData {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  subscriberCount?: number;
  contentCount?: number;
}

const samplePodcasts = [
  { title: 'Lex Fridman #375 - Sam Altman', url: 'https://www.youtube.com/watch?v=jvqFAi7vkBc' },
  { title: 'Anton Osika Lovable - 20VC', url: 'https://www.youtube.com/watch?v=DHLczPQj9rA' },
  { title: 'Tim Ferriss - Naval Ravikant', url: 'https://www.youtube.com/watch?v=HiYo14wylQw' },
];

/**
 * Formats raw summary data into SummaryData type
 */
const formatSummaryData = (item: any): SummaryData => ({
  id: item.id,
  title: item.title || 'YouTube Video',
  summary: item.summary || 'No summary available',
  tags: Array.isArray(item.tags) ? item.tags : [],
  featured_names: Array.isArray(item.featured_names) ? item.featured_names : [],
  publisher_name: item.publisher_name || 'Unknown Channel',
  publisher_id: item.publisher_id || '',
  content_created_at: item.content_created_at || new Date().toISOString(),
  videoId: item.content_id || '',
  content_id: item.content_id,
  status: item.status || 'unknown',
});

export default function Home() {
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [recentSummaries, setRecentSummaries] = useState<SummaryData[]>([]);
  const [featuredChannels, setFeaturedChannels] = useState<ChannelData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingNew, setIsGeneratingNew] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  // Memoized fetch for featured channels
  const fetchFeaturedChannels = useCallback(async () => {
    const { data, error } = await supabase.from('channels').select('*').in('id', [
      'UCcefcZRL2oaA_uBNeo5UOWg', // Y Combinator
      'UCSHZKyawb77ixDdsGog4iWA', // Lex Fridman
      'UCLtTf_uKt0Itd0NG7txrwXA', // The Knowledge Project
    ]);

    if (error) {
      console.error('Error fetching featured channels:', error);
      return;
    }

    setFeaturedChannels(
      data.map(channel => ({
        id: channel.id,
        name: channel.name,
        description: channel.description || '',
        thumbnail: channel.thumbnail,
      })),
    );
  }, []);

  // Memoized fetch for recent summaries
  const fetchRecentSummaries = useCallback(async () => {
    if (user) {
      await fetchAuthenticatedUserSummaries();
    } else {
      await fetchAnonymousUserSummaries();
    }
  }, [user]);

  // Fetch summaries for logged-in users
  const fetchAuthenticatedUserSummaries = useCallback(async () => {
    if (!user) return;

    // Fetch all user-generated summary IDs
    const { data: allUserSummaries, error: userError } = await supabase
      .from('user_generated_summaries')
      .select('summary_id')
      .eq('user_id', user.id)
      .order('generated_at', { ascending: false });

    if (userError) {
      console.error('Error fetching user summaries:', userError);
      return;
    }

    const userSummaryIds = allUserSummaries.map(us => us.summary_id);

    // Fetch subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('channel_id')
      .eq('user_id', user.id);

    if (subError) {
      console.error('Error fetching subscriptions:', subError);
      return;
    }

    const subscribedChannelIds = subscriptions.map(sub => sub.channel_id);

    if (!userSummaryIds.length && !subscribedChannelIds.length) {
      setRecentSummaries([]);
      return;
    }

    // Fetch recent summaries
    const orCondition = [
      userSummaryIds.length ? `id.in.(${userSummaryIds.join(',')})` : '',
      subscribedChannelIds.length ? `publisher_id.in.(${subscribedChannelIds.join(',')})` : '',
    ]
      .filter(Boolean)
      .join(',');

    const { data: summaries, error: summariesError } = await supabase
      .from('summaries')
      .select('*')
      .or(orCondition)
      .order('created_at', { ascending: false })
      .limit(5);

    if (summariesError) {
      console.error('Error fetching recent summaries:', summariesError);
      return;
    }

    const formattedSummaries = summaries.map(formatSummaryData);
    setRecentSummaries(formattedSummaries);

    // Set summaryData to the most recent user-generated summary if not set
    if (!summaryData && formattedSummaries.length) {
      const mostRecentUserSummary = formattedSummaries.find(s => userSummaryIds.includes(s.id));
      setSummaryData(mostRecentUserSummary || formattedSummaries[0]);
    }
  }, [user, summaryData]);

  // Fetch summaries for anonymous users
  const fetchAnonymousUserSummaries = useCallback(async () => {
    const contentIds = getAnonymousGeneratedContentIds().slice(-5).reverse();
    if (!contentIds.length) return;

    const { data, error } = await supabase
      .from('summaries')
      .select('*')
      .in('content_id', contentIds)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching anonymous summaries:', error);
      return;
    }

    const formattedSummaries = data.map(formatSummaryData);
    setRecentSummaries(formattedSummaries);

    if (!summaryData && formattedSummaries.length) {
      setSummaryData(formattedSummaries[0]);
    }
  }, [summaryData]);

  // Initial data fetch
  useEffect(() => {
    fetchRecentSummaries();
    fetchFeaturedChannels();
  }, [fetchRecentSummaries, fetchFeaturedChannels]);

  // Handle URL submission
  const handleSubmit = async (url: string) => {
    setIsLoading(true);
    setError(null);
    setIsGeneratingNew(false);

    try {
      const contentId = extractYouTubeVideoId(url);
      if (contentId && (await checkExistingSummary(contentId))) return;

      setIsGeneratingNew(true);
      await generateNewSummary(url, contentId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setSummaryData(null);
    } finally {
      setIsLoading(false);
      setIsGeneratingNew(false);
    }
  };

  // Check for existing summary
  const checkExistingSummary = async (contentId: string): Promise<boolean> => {
    const { data } = await supabase
      .from('summaries')
      .select('*')
      .eq('content_id', contentId)
      .single();

    if (data?.status === 'completed') {
      setSummaryData(formatSummaryData(data));
      if (!user) {
        addAnonymousGeneratedContentId(contentId);
        await fetchRecentSummaries();
      }
      setIsLoading(false);
      return true;
    }
    setIsGeneratingNew(true);
    return false;
  };

  // Generate new summary
  const generateNewSummary = async (url: string, contentId?: string) => {
    const response = await fetch('/api/summaries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });

    if (!response.ok)
      throw new Error((await response.json()).error || 'Failed to generate summary');

    const data = await response.json();
    const formattedData = formatSummaryData({
      ...data,
      content_id: data.content_id || contentId,
      videoId: data.content_id || contentId,
      publisher_id: data.publisher_id || data.channelId || '',
      status: data.status || 'completed',
    });

    setSummaryData(formattedData);

    if (!user && contentId) {
      addAnonymousGeneratedContentId(contentId);
      await fetchRecentSummaries();
    }
  };

  return (
    <main className='flex flex-col min-h-[calc(100vh-64px)]'>
      {/* Hero Section */}
      <div className='max-w-4xl mx-auto'>
        <h1 className='text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4'>
          Podcast Summaries in Your Inbox
        </h1>
        <p className='text-xl md:text-2xl text-gray-600 mb-8'>
          Summaries of Your Top Channels, Every Day
        </p>
        <div className='max-w-2xl mx-auto mb-6'>
          <YoutubeUrlInput onSubmit={handleSubmit} isLoading={isLoading} className='flex-1' />
        </div>
        {error && <p className='mt-2 text-red-500 text-sm'>{error}</p>}
        <SummaryProgressLoader isVisible={isLoading && isGeneratingNew} durationInSeconds={8} />
        {!isLoading && (
          <div className='mt-4'>
            <p className='text-gray-600 mb-3'>Try These Podcasts:</p>
            <div className='flex flex-wrap justify-center gap-2'>
              {samplePodcasts.map((podcast, i) => (
                <button
                  key={i}
                  onClick={() => handleSubmit(podcast.url)}
                  className='bg-white text-gray-800 px-4 py-2 rounded-full text-sm border border-gray-200 hover:border-blue-300 hover:text-blue-600 transition-colors shadow-sm flex items-center gap-1'>
                  {podcast.title} <ExternalLink size={14} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Summary Section */}
      {summaryData && (
        <div className='max-w-7xl mx-auto'>
          <SummaryCard
            title={summaryData.title}
            date={summaryData.content_created_at}
            channelName={summaryData.publisher_name}
            channelId={summaryData.publisher_id}
            summary={summaryData.summary}
            tags={summaryData.tags}
            peopleMentioned={summaryData.featured_names}
            videoId={summaryData.videoId || summaryData.content_id || ''}
          />
        </div>
      )}

      {/* Recent Summaries Section */}
      {recentSummaries.length > 0 && (
        <section className='py-10 px-1 md:px-4 bg-gray-50'>
          <div className='max-w-7xl mx-auto'>
            <h2 className='text-2xl md:text-3xl font-bold text-gray-900 mb-6'>
              Your Recent Summaries
            </h2>
            <div className='flex flex-col gap-6'>
              {recentSummaries
                .filter(s => s.id !== summaryData?.id)
                .slice(0, 4)
                .map(summary => (
                  <SummaryCard
                    key={summary.id}
                    title={summary.title}
                    date={summary.content_created_at}
                    channelName={summary.publisher_name}
                    channelId={summary.publisher_id}
                    summary={summary.summary}
                    tags={summary.tags}
                    peopleMentioned={summary.featured_names}
                    videoId={summary.videoId || summary.content_id || ''}
                  />
                ))}
            </div>
            {recentSummaries.length > 4 && (
              <div className='mt-6 text-center w-full flex justify-center'>
                <Link href='/history'>
                  <GlowButton
                    glowColors={['#4263eb', '#3b5bdb', '#5c7cfa', '#748ffc']}
                    glowMode='static'
                    glowBlur='soft'>
                    View All History
                  </GlowButton>
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* How It Works Section */}
      <div className='max-w-6xl mx-auto'>
        <h2 className='text-3xl font-bold text-gray-900 text-center mb-12'>How It Works</h2>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
          {[
            {
              icon: <ExternalLink size={24} className='text-blue-600' />,
              title: 'Paste a Link',
              desc: 'Paste any YouTube podcast link you want to summarize',
              bg: 'blue',
            },
            {
              icon: <Bookmark size={24} className='text-indigo-600' />,
              title: 'Get a Summary',
              desc: 'Receive a concise, detailed summary of the podcast content',
              bg: 'indigo',
            },
            {
              icon: <Bell size={24} className='text-purple-600' />,
              title: 'Subscribe for Updates',
              desc: 'Get daily summaries of new content from your favorite channels',
              bg: 'purple',
            },
          ].map(step => (
            <div key={step.title} className={`bg-${step.bg}-50 p-8 rounded-2xl text-center`}>
              <div
                className={`w-16 h-16 bg-${step.bg}-100 rounded-full flex items-center justify-center mx-auto mb-6`}>
                {step.icon}
              </div>
              <h3 className='text-xl font-semibold mb-3'>{step.title}</h3>
              <p className='text-gray-600'>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Subscribe Channels Section */}
      <div className='max-w-6xl mx-auto'>
        <h2 className='text-3xl font-bold text-gray-900 text-center mb-4'>
          Subscribe To Your Channels
        </h2>
        <p className='text-xl text-gray-600 text-center mb-10'>
          Get daily summaries from your favorite creators
        </p>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-10'>
          {featuredChannels.map(channel => (
            <ChannelCard
              key={channel.id}
              id={channel.id}
              name={channel.name}
              description={channel.description}
              thumbnail={channel.thumbnail}
              subscriberCount={channel.subscriberCount}
              contentCount={channel.contentCount}
            />
          ))}
        </div>
        <div className='text-center w-full flex justify-center'>
          <Link href='/discover'>
            <GlowButton
              glowColors={['#4263eb', '#3b5bdb', '#5c7cfa', '#748ffc']}
              glowMode='static'
              glowBlur='soft'>
              Discover More Channels
            </GlowButton>
          </Link>
        </div>
      </div>

      {/* Benefits Section */}
      <div className='max-w-6xl mx-auto'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
          {[
            {
              icon: <Clock size={28} className='text-amber-500' />,
              title: 'Save Time',
              desc: 'Get the key points without listening to hours of content',
              bg: 'amber',
            },
            {
              icon: <Bell size={28} className='text-emerald-500' />,
              title: 'Stay Updated',
              desc: 'Never miss important insights from your favorite creators',
              bg: 'emerald',
            },
            {
              icon: <Bookmark size={28} className='text-blue-500' />,
              title: 'Choose What to Hear',
              desc: 'Decide which episodes are worth your full attention',
              bg: 'blue',
            },
          ].map(benefit => (
            <div key={benefit.title} className='text-center'>
              <div
                className={`w-14 h-14 bg-${benefit.bg}-50 rounded-full flex items-center justify-center mx-auto mb-4`}>
                {benefit.icon}
              </div>
              <h3 className='text-xl font-semibold mb-2'>{benefit.title}</h3>
              <p className='text-gray-600'>{benefit.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className='py-10 px-4 bg-gray-50 border-t border-gray-100'>
        <div className='max-w-6xl mx-auto text-center'>
          <p className='text-gray-600 flex items-center justify-center mb-3'>
            Made with <Heart size={16} className='text-red-500 mx-1' fill='currentColor' /> in India
          </p>
          <div className='flex items-center justify-center gap-4 text-sm text-gray-500'>
            <a href='mailto:founder@getoneplace.com' className='hover:text-blue-600'>
              Email Feedback
            </a>
            <a
              href='https://wa.me/919820963946'
              target='_blank'
              rel='noopener noreferrer'
              className='hover:text-green-600'>
              Send Feedback
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
