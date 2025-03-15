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
import { Heart, Clock, Bell, Bookmark, ExternalLink } from 'lucide-react';
import { GlowButton } from '@/components/ui/glow-button';
import { ChannelCard } from '@/components/ChannelCard';
import { formatSummaryData, SummaryData } from '@/lib/utils/formatSummaryData';

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

export default function Home() {
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [recentSummaries, setRecentSummaries] = useState<SummaryData[]>([]);
  const [featuredChannels, setFeaturedChannels] = useState<ChannelData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingNew, setIsGeneratingNew] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

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

    const formattedSummaries = summaries.map(item => formatSummaryData(item));
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

    const formattedSummaries = data.map(item => formatSummaryData(item));
    setRecentSummaries(formattedSummaries);

    if (!summaryData && formattedSummaries.length) {
      setSummaryData(formattedSummaries[0]);
    }
  }, [summaryData]);

  // Memoized fetch for recent summaries
  const fetchRecentSummaries = useCallback(async () => {
    if (user) {
      await fetchAuthenticatedUserSummaries();
    } else {
      await fetchAnonymousUserSummaries();
    }
  }, [user, fetchAuthenticatedUserSummaries, fetchAnonymousUserSummaries]);

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

  // Initial data fetch
  useEffect(() => {
    fetchRecentSummaries();
    fetchFeaturedChannels();
  }, [fetchRecentSummaries, fetchFeaturedChannels]);

  // Handle URL submission
  const handleSubmit = async (url: string) => {
    setIsLoading(true);
    setError(null);
    setIsGeneratingNew(true);

    try {
      const contentId = extractYouTubeVideoId(url);
      await fetchOrGenerateSummary(url, contentId || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setSummaryData(null);
    } finally {
      setIsLoading(false);
      setIsGeneratingNew(false);
    }
  };

  // Fetch existing summary or generate a new one
  const fetchOrGenerateSummary = async (url: string, contentId?: string) => {
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

    // Store content ID for anonymous users and refresh recent summaries
    if (!user && contentId) {
      addAnonymousGeneratedContentId(contentId);
      await fetchRecentSummaries();
    }
  };

  return (
    <main className='flex flex-col min-h-[calc(100vh-64px)] dark:bg-black bg-white dark:text-white text-gray-900'>
      {/* Hero Section - Enhanced with dynamic mesh gradient */}
      <div className='relative w-full pt-16 pb-24 z-10 overflow-hidden'>
        {/* Enhanced mesh gradient background - now full width */}
        <div className='absolute inset-0 dark:bg-grid-small-white/[0.15] bg-grid-small-black/[0.07] -z-10' />

        {/* Improved gradient overlay with more depth - now full width with flush bottom */}
        <div className='absolute inset-0 dark:bg-gradient-to-b dark:from-black/10 dark:via-black/80 dark:to-black bg-gradient-to-b from-white/30 via-white/80 to-white -z-10' />

        {/* Animated noise texture for added richness - now full width */}
        <div className='absolute inset-0 bg-noise opacity-[0.03] dark:opacity-[0.07] mix-blend-overlay -z-10'></div>

        {/* Enhanced floating gradient orbs with better positioning and animation - positioned relative to full width */}
        <div className='absolute -top-20 left-[10%] w-[30rem] h-[30rem] dark:bg-blue-600 bg-blue-400 rounded-full mix-blend-multiply filter blur-[128px] dark:opacity-20 opacity-15 animate-blob-slow'></div>
        <div className='absolute top-60 right-[10%] w-[35rem] h-[35rem] dark:bg-purple-600 bg-purple-400 rounded-full mix-blend-multiply filter blur-[128px] dark:opacity-20 opacity-15 animate-blob-slow animation-delay-2000'></div>
        <div className='absolute -bottom-60 left-[20%] w-[40rem] h-[40rem] dark:bg-indigo-600 bg-indigo-400 rounded-full mix-blend-multiply filter blur-[128px] dark:opacity-20 opacity-15 animate-blob-slow animation-delay-4000'></div>
        <div className='absolute top-40 left-1/2 -translate-x-1/2 w-[25rem] h-[25rem] dark:bg-cyan-600 bg-cyan-400 rounded-full mix-blend-multiply filter blur-[128px] dark:opacity-15 opacity-10 animate-pulse animation-delay-3000'></div>
        
        {/* Content container - maintains original width and positioning */}
        <div className='relative max-w-5xl mx-auto px-6 z-20'>

        <h1 className='text-4xl md:text-5xl lg:text-6xl font-bold mx-auto text-center dark:text-white text-gray-900 mb-6 tracking-tight'>
            Podcast Summaries <br className='hidden md:block' />
            <span className='bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600'>
              in Your Inbox
            </span>
          </h1>
          <p className='text-xl md:text-2xl dark:text-gray-400 text-gray-600 mb-12 max-w-2xl mx-auto text-center'>
            Summaries of Your Top Channels, Every Day
          </p>
          <div className='max-w-2xl mb-10 mx-auto'>
            <YoutubeUrlInput onSubmit={handleSubmit} isLoading={isLoading} className='flex-1' />
          </div>
          {error && <p className='mt-2 text-red-400 text-sm text-center'>{error}</p>}
          <SummaryProgressLoader isVisible={isLoading && isGeneratingNew} durationInSeconds={8} />
          {!isLoading && (
            <div className='mt-8 text-center'>
              <p className='dark:text-gray-400 text-gray-500 mb-4 text-sm uppercase tracking-wider font-medium'>
                Try These Podcasts:
              </p>
              <div className='flex flex-wrap gap-3 justify-center'>
                {samplePodcasts.map((podcast, i) => (
                  <button
                    key={i}
                    onClick={() => handleSubmit(podcast.url)}
                    className='relative bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 px-4 py-2.5 rounded-lg dark:rounded-md text-sm border border-gray-200/80 dark:border-gray-800 hover:border-blue-500/50 dark:hover:border-blue-500 transition-all duration-300 shadow-sm dark:shadow-md hover:shadow-md flex items-center gap-1.5 group z-[1] backdrop-blur-sm overflow-hidden'>
                    {/* Subtle glow effect that appears on hover (light mode only) */}
                    <div className='absolute inset-0 dark:hidden bg-gradient-to-r from-blue-400/5 to-purple-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none'></div>
                    {/* Grid pattern overlay (light mode only) */}
                    <div className='absolute inset-0 dark:hidden bg-grid-small-black/[0.015] opacity-0 group-hover:opacity-100 transition-opacity'></div>

                    <span className='relative z-10 font-medium group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors duration-300'>
                      {podcast.title}
                    </span>
                    <ExternalLink
                      size={14}
                      className='relative z-10 group-hover:translate-x-0.5 transition-all duration-300 text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400'
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Summary Section */}
      {summaryData && (
        <div className='max-w-7xl mx-auto px-6 pb-16 -mt-8 relative z-20'>
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
        <section className='py-16 px-6 dark:bg-gradient-to-b dark:from-black dark:to-gray-900 bg-gradient-to-b from-white to-gray-100 relative z-10'>
          {/* Subtle grid overlay */}
          <div className='absolute inset-0 dark:bg-grid-small-white/[0.1] bg-grid-small-black/[0.05] -z-10' />

          <div className='max-w-7xl mx-auto'>
            <h2 className='text-2xl md:text-3xl font-bold dark:text-white text-gray-900 mb-8 tracking-tight'>
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
              <div className='mt-10 text-center w-full flex justify-center'>
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
      <div className='max-w-6xl mx-auto px-6 py-20 relative'>
        {/* Gradient background */}
        <div className='absolute inset-0 dark:bg-gradient-to-b dark:from-gray-900 dark:to-black bg-gradient-to-b from-gray-100 to-white -z-10' />
        <div className='absolute inset-0 dark:bg-grid-small-white/[0.1] bg-grid-small-black/[0.05] -z-10' />

        <h2 className='text-3xl font-bold dark:text-white text-gray-900 text-center mb-16 tracking-tight'>
          How It Works
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-10'>
          {[
            {
              icon: <ExternalLink size={24} className='text-blue-400' />,
              title: 'Paste a Link',
              desc: 'Paste any YouTube podcast link you want to summarize',
              border: 'border-blue-500/30',
              glow: 'before:bg-blue-600/20',
            },
            {
              icon: <Bookmark size={24} className='text-indigo-400' />,
              title: 'Get a Summary',
              desc: 'Receive a concise, detailed summary of the podcast content',
              border: 'border-indigo-500/30',
              glow: 'before:bg-indigo-600/20',
            },
            {
              icon: <Bell size={24} className='text-purple-400' />,
              title: 'Subscribe for Updates',
              desc: 'Get daily summaries of new content from your favorite channels',
              border: 'border-purple-500/30',
              glow: 'before:bg-purple-600/20',
            },
          ].map(step => (
            <div
              key={step.title}
              className={`dark:bg-gray-900/50 bg-white/70 p-8 rounded-xl backdrop-blur-sm text-center relative border dark:${
                step.border
              } ${step.border.replace('dark:', '')} shadow-sm
                          before:absolute before:inset-0 before:rounded-xl dark:${
                            step.glow
                          } ${step.glow.replace('dark:', '')} before:opacity-0
                          hover:before:opacity-100 before:transition-opacity before:-z-10 transition-all duration-300
                          hover:shadow-lg dark:hover:border-opacity-80 hover:border-opacity-80 group`}>
              <div className='w-16 h-16 dark:bg-gray-800 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg transition-transform duration-300 group-hover:scale-110'>
                {step.icon}
              </div>
              <h3 className='text-xl font-semibold mb-3 dark:text-white text-gray-900 transition-colors duration-300 group-hover:text-blue-500 dark:group-hover:text-blue-400'>
                {step.title}
              </h3>
              <p className='dark:text-gray-400 text-gray-600'>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Subscribe Channels Section */}
      <div className='max-w-6xl mx-auto px-6 py-20 relative'>
        {/* Gradient background */}
        <div className='absolute inset-0 dark:bg-grid-small-white/[0.1] bg-grid-small-black/[0.05] -z-10' />
        <div className='absolute inset-0 dark:bg-gradient-to-b dark:from-black dark:to-gray-900/80 bg-gradient-to-b from-white to-gray-50 -z-10' />

        <h2 className='text-3xl font-bold dark:text-white text-gray-900 text-center mb-4 tracking-tight'>
          Subscribe To Your Channels
        </h2>
        <p className='text-xl dark:text-gray-400 text-gray-600 text-center mb-16'>
          Get daily summaries from your favorite creators
        </p>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-14'>
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
      <div className='max-w-6xl mx-auto px-6 py-20 relative'>
        {/* Gradient background */}
        <div className='absolute inset-0 dark:bg-gradient-to-t dark:from-black dark:to-gray-900/60 bg-gradient-to-t from-gray-50 to-white -z-10' />
        <div className='absolute inset-0 dark:bg-grid-small-white/[0.05] bg-grid-small-black/[0.03] -z-10' />

        <div className='grid grid-cols-1 md:grid-cols-3 gap-12'>
          {[
            {
              icon: <Clock size={28} className='text-amber-400' />,
              title: 'Save Time',
              desc: 'Get the key points without listening to hours of content',
              bg: 'bg-amber-900/20',
              border: 'border-amber-500/30',
            },
            {
              icon: <Bell size={28} className='text-emerald-400' />,
              title: 'Stay Updated',
              desc: 'Never miss important insights from your favorite creators',
              bg: 'bg-emerald-900/20',
              border: 'border-emerald-500/30',
            },
            {
              icon: <Bookmark size={28} className='text-blue-400' />,
              title: 'Choose What to Hear',
              desc: 'Decide which episodes are worth your full attention',
              bg: 'bg-blue-900/20',
              border: 'border-blue-500/30',
            },
          ].map(benefit => (
            <div key={benefit.title} className='text-center'>
              <div
                className={`w-16 h-16 dark:${benefit.bg} ${benefit.border} bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-6 border`}>
                {benefit.icon}
              </div>
              <h3 className='text-xl font-semibold mb-3 dark:text-white text-gray-900'>
                {benefit.title}
              </h3>
              <p className='dark:text-gray-400 text-gray-600'>{benefit.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className='py-12 px-6 dark:bg-gray-950 bg-gray-100 dark:border-t dark:border-gray-800 border-t border-gray-200'>
        <div className='max-w-6xl mx-auto text-center'>
          <p className='dark:text-gray-400 text-gray-600 flex items-center justify-center mb-4'>
            Made with <Heart size={16} className='text-red-500 mx-1' fill='currentColor' /> in India
          </p>
          <div className='flex items-center justify-center gap-8 text-sm dark:text-gray-500 text-gray-600 mb-6'>
            <a
              href='mailto:founder@getoneplace.com'
              className='dark:hover:text-blue-400 hover:text-blue-600 transition-colors'>
              Email Feedback
            </a>
            <a
              href='https://wa.me/919820963946'
              target='_blank'
              rel='noopener noreferrer'
              className='dark:hover:text-green-400 hover:text-green-600 transition-colors'>
              Text Feedback
            </a>
          </div>

          {/* GitHub Repository Link */}
          <div className='mb-8 flex justify-center'>
            <a
              href='https://github.com/nkjain92/oneplace/'
              target='_blank'
              rel='noopener noreferrer'
              className='group relative flex items-center gap-2 px-6 py-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all duration-300 shadow-sm hover:shadow-md'>
              {/* Background effects */}
              <div className='absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 dark:from-blue-500/10 dark:to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg'></div>
              <div className='absolute inset-0 bg-grid-small-black/[0.02] dark:bg-grid-small-white/[0.05] opacity-0 group-hover:opacity-100 transition-opacity rounded-lg'></div>

              {/* GitHub icon */}
              <svg
                xmlns='http://www.w3.org/2000/svg'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
                className='w-5 h-5 text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors'>
                <path d='M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22'></path>
              </svg>

              {/* Text */}
              <span className='relative z-10 font-medium text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors'>
                Open Source on GitHub
              </span>

              {/* Arrow icon */}
              <svg
                xmlns='http://www.w3.org/2000/svg'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
                className='w-4 h-4 text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all'>
                <path d='M5 12h14'></path>
                <path d='m12 5 7 7-7 7'></path>
              </svg>
            </a>
          </div>

          <div className='text-xs dark:text-gray-600 text-gray-500'>
            © {new Date().getFullYear()} OnePlace. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}
