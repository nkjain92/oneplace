// src/app/page.tsx - Home page component that handles YouTube URL submissions and displays summaries
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

// Define the interface for summary data based on SummaryCard props
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

// Sample podcast videos for quick access
const samplePodcasts = [
  {
    title: 'Lex Fridman #375 - Sam Altman',
    url: 'https://www.youtube.com/watch?v=jvqFAi7vkBc',
  },
  {
    title: 'Anton Osika Lovable - 20VC',
    url: 'https://www.youtube.com/watch?v=DHLczPQj9rA',
  },
  {
    title: 'Tim Ferriss - Naval Ravikant',
    url: 'https://www.youtube.com/watch?v=HiYo14wylQw',
  },
];

// Sample channels for subscription CTA
const featuredChannels = [
  {
    id: 'UCSHZKyawb77ixDdsGog4iWA',
    name: 'Lex Fridman',
    description: "Deep conversations with the world's most interesting people",
    image: '/images/channels/lex-fridman.jpeg',
    subscriberCount: 4200000,
    contentCount: 375,
  },
  {
    id: 'UCf0PBRjhf0rF8fWBIxTuoWA',
    name: '20VC with Harry Stebbings',
    description: '20VC is about interviweing founders, VCs and operators in tech',
    image: '/images/channels/20vc.webp',
    subscriberCount: 3700000,
    contentCount: 156,
  },
  {
    id: 'UCznv7Vf9nBdJYvBagFdAHWw',
    name: 'The Knowledge Project with Shane Parrish',
    description: 'Shane Parrish interviews world-class individuals',
    image: '/images/channels/the-knowledge-project.png',
    subscriberCount: 1100000,
    contentCount: 680,
  },
];

export default function Home() {
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [recentSummaries, setRecentSummaries] = useState<SummaryData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingNew, setIsGeneratingNew] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  // Use useCallback to memoize the fetchRecentSummaries function
  const fetchRecentSummaries = useCallback(async () => {
    try {
      // Get content IDs from storage
      const contentIds = getAnonymousGeneratedContentIds();
      console.log('Local storage content IDs:', contentIds);

      if (contentIds.length > 0) {
        // Get the 5 most recent content IDs
        const recentContentIds = contentIds.slice(-5).reverse();
        console.log('Using recent content IDs:', recentContentIds);

        // Fetch the summaries from the database
        const { data, error } = await supabase
          .from('summaries')
          .select('*')
          .in('content_id', recentContentIds)
          .order('content_created_at', { ascending: false })
          .limit(5);

        if (error) {
          console.error('Error fetching recent summaries:', error);
          return;
        }

        console.log('Fetched summaries from DB:', data?.length || 0);

        if (data && data.length > 0) {
          // Format the data to match the SummaryCard props
          const formattedSummaries = data.map(item => ({
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
          }));

          console.log('Formatted summaries:', formattedSummaries.length);

          // Set the most recent summary as the main summary if none is selected
          if (!summaryData) {
            setSummaryData(formattedSummaries[0]);
          }

          // Set all summaries for the recent list
          setRecentSummaries(formattedSummaries);
        }
      }
    } catch (err) {
      console.error('Error loading recent summaries:', err);
    }
  }, [summaryData]); // Add summaryData as a dependency

  // Fetch the most recent summaries for anonymous users on initial load
  useEffect(() => {
    fetchRecentSummaries();
  }, [user, fetchRecentSummaries]); // fetchRecentSummaries is now properly memoized

  const handleSampleClick = async (url: string) => {
    await handleSubmit(url);
  };

  const handleSubmit = async (url: string) => {
    setIsLoading(true);
    setError(null);
    setIsGeneratingNew(false);

    try {
      // Extract video ID for local storage (for anonymous users)
      const contentId = extractYouTubeVideoId(url);

      // First, check if we already have this summary
      if (contentId) {
        const { data: existingData } = await supabase
          .from('summaries')
          .select('*')
          .eq('content_id', contentId)
          .single();

        if (existingData && existingData.summary && existingData.status === 'completed') {
          // If we already have the summary and it's completed, use it directly
          const formattedData: SummaryData = {
            id: existingData.id,
            title: existingData.title || 'YouTube Video',
            summary: existingData.summary || 'No summary available',
            tags: Array.isArray(existingData.tags) ? existingData.tags : [],
            featured_names: Array.isArray(existingData.featured_names)
              ? existingData.featured_names
              : [],
            publisher_name: existingData.publisher_name || 'Unknown Channel',
            publisher_id: existingData.publisher_id || '',
            content_created_at: existingData.content_created_at || new Date().toISOString(),
            videoId: existingData.content_id || contentId || '',
            content_id: existingData.content_id,
          };

          setSummaryData(formattedData);

          // For anonymous users, store content_id in local storage
          if (!user && contentId) {
            try {
              addAnonymousGeneratedContentId(contentId);
              console.log('Added to local storage history:', contentId);
              // Refresh recent summaries after adding a new one
              fetchRecentSummaries();
            } catch (storageError) {
              console.error('Error storing in local storage:', storageError);
            }
          }

          setIsLoading(false);
          return;
        } else {
          // We need to generate a new summary (either doesn't exist, is empty, or is still processing)
          setIsGeneratingNew(true);

          // If we have an existing record, log the status
          if (existingData) {
            console.log(
              `Regenerating summary for video ID: ${contentId}, current status: ${existingData.status}`,
            );
          }
        }
      } else {
        // If we can't extract a content ID, assume we need to generate a new summary
        setIsGeneratingNew(true);
      }

      // Call the API to get the summary
      const response = await fetch('/api/summaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch summary');
      }

      const data = await response.json();

      // Format the data to match the SummaryCard props
      const formattedData: SummaryData = {
        id: data.id,
        title: data.title || 'YouTube Video',
        summary: data.summary || 'No summary available',
        tags: Array.isArray(data.tags) ? data.tags : [],
        featured_names: Array.isArray(data.featured_names) ? data.featured_names : [],
        publisher_name: data.publisher_name || 'Unknown Channel',
        publisher_id: data.publisher_id || data.channelId || '',
        content_created_at: data.content_created_at || new Date().toISOString(),
        videoId: data.content_id || contentId || '',
        content_id: data.content_id || contentId,
        status: data.status || 'completed',
      };

      setSummaryData(formattedData);

      // For anonymous users, store content_id in local storage
      if (!user && contentId) {
        try {
          addAnonymousGeneratedContentId(contentId);
          console.log('Added to local storage history:', contentId);
          // Refresh recent summaries after adding a new one
          fetchRecentSummaries();
        } catch (storageError) {
          console.error('Error storing in local storage:', storageError);
        }
      }
    } catch (err) {
      console.error('Error generating summary:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setSummaryData(null);
    } finally {
      setIsGeneratingNew(false);
      setIsLoading(false);
    }
  };

  return (
    <main className='flex flex-col min-h-[calc(100vh-64px)]'>
      {/* Hero Section */}
      <section className='py-16 px-3 md:px-6 bg-gradient-to-br from-blue-50 to-purple-50 text-center'>
        <div className='max-w-4xl mx-auto'>
          <h1 className='text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4'>
            Podcast Summaries in Your Inbox
          </h1>
          <p className='text-xl md:text-2xl text-gray-600 mb-8'>
            Summaries of Your Top Channels, Every Day
          </p>

          {/* YouTube URL Input */}
          <div className='w-full max-w-2xl mx-auto mb-6'>
            <YoutubeUrlInput onSubmit={handleSubmit} isLoading={isLoading} className='flex-1' />
          </div>

          {error && <p className='mt-2 text-red-500 text-sm'>{error}</p>}

          {/* Progress Loader */}
          <SummaryProgressLoader isVisible={isLoading && isGeneratingNew} durationInSeconds={8} />

          {/* Sample Podcasts */}
          {!isLoading && (
            <div className='mt-4 mb-1'>
              <p className='text-gray-600 mb-3'>Try These Podcasts:</p>
              <div className='flex flex-wrap justify-center gap-2'>
                {samplePodcasts.map((podcast, index) => (
                  <button
                    key={index}
                    onClick={() => handleSampleClick(podcast.url)}
                    className='bg-white text-gray-800 px-4 py-2 rounded-full text-sm border border-gray-200
                             hover:border-blue-300 hover:text-blue-600 transition-colors shadow-sm flex items-center gap-1'>
                    {podcast.title}
                    <ExternalLink size={14} className='ml-1' />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Summary Section */}
      {summaryData && (
        <section className='py-10 px-1 md:px-4 bg-white'>
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
        </section>
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
                .filter(summary => summary.id !== summaryData?.id)
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

            {recentSummaries.length > 5 && (
              <div className='mt-6 text-center'>
                <Link href='/history'>
                  <Button variant='outline' className='mt-4'>
                    View All History
                    <ArrowRight className='ml-2 h-4 w-4' />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* How It Works Section */}
      <section className='py-16 px-4 bg-white'>
        <div className='max-w-6xl mx-auto'>
          <h2 className='text-3xl font-bold text-gray-900 text-center mb-12'>How It Works</h2>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            <div className='bg-blue-50 p-8 rounded-2xl text-center'>
              <div className='w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6'>
                <ExternalLink size={24} className='text-blue-600' />
              </div>
              <h3 className='text-xl font-semibold mb-3'>Paste a Link</h3>
              <p className='text-gray-600'>Paste any YouTube podcast link you want to summarize</p>
            </div>

            <div className='bg-indigo-50 p-8 rounded-2xl text-center'>
              <div className='w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6'>
                <Bookmark size={24} className='text-indigo-600' />
              </div>
              <h3 className='text-xl font-semibold mb-3'>Get a Summary</h3>
              <p className='text-gray-600'>
                Receive a concise, detailed summary of the podcast content
              </p>
            </div>

            <div className='bg-purple-50 p-8 rounded-2xl text-center'>
              <div className='w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6'>
                <Bell size={24} className='text-purple-600' />
              </div>
              <h3 className='text-xl font-semibold mb-3'>Subscribe for Updates</h3>
              <p className='text-gray-600'>
                Get daily summaries of new content from your favorite channels
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Subscribe Channels Section */}
      <section className='py-16 px-4 bg-gray-50'>
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
                image={channel.image}
                subscriberCount={channel.subscriberCount}
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
      </section>

      {/* Benefits Section */}
      <section className='py-16 px-4 bg-white'>
        <div className='max-w-6xl mx-auto'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            <div className='text-center'>
              <div className='w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4'>
                <Clock size={28} className='text-amber-500' />
              </div>
              <h3 className='text-xl font-semibold mb-2'>Save Time</h3>
              <p className='text-gray-600'>
                Get the key points without listening to hours of content
              </p>
            </div>

            <div className='text-center'>
              <div className='w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4'>
                <Bell size={28} className='text-emerald-500' />
              </div>
              <h3 className='text-xl font-semibold mb-2'>Stay Updated</h3>
              <p className='text-gray-600'>
                Never miss important insights from your favorite creators
              </p>
            </div>

            <div className='text-center'>
              <div className='w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4'>
                <Bookmark size={28} className='text-blue-500' />
              </div>
              <h3 className='text-xl font-semibold mb-2'>Choose What to Hear</h3>
              <p className='text-gray-600'>Decide which episodes are worth your full attention</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className='py-10 px-4 bg-gray-50 border-t border-gray-100'>
        <div className='max-w-6xl mx-auto text-center'>
          <p className='text-gray-600 flex items-center justify-center mb-3'>
            Made with <Heart size={16} className='text-red-500 mx-1' fill='currentColor' /> by
            Nishank Jain
          </p>
          <div className='flex items-center justify-center gap-4 text-sm text-gray-500'>
            <a href='mailto:founder@getoneplace.com' className='hover:text-blue-600'>
              founder@getoneplace.com
            </a>
            <a
              href='https://wa.me/919820963946'
              target='_blank'
              rel='noopener noreferrer'
              className='hover:text-green-600'>
              WhatsApp: +91 9820963946
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
