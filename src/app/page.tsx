// src/app/page.tsx - Home page component that handles YouTube URL submissions and displays summaries
'use client';

import { useState, useEffect } from 'react';
import { YoutubeUrlInput } from '@/components/YoutubeUrlInput';
import SummaryCard from '@/components/SummaryCard';
import { useAuthStore } from '@/store/authStore';
import { extractYouTubeVideoId } from '@/lib/utils/youtube';
import {
  addAnonymousGeneratedContentId,
  getAnonymousGeneratedContentIds,
} from '@/lib/localStorage';
import { supabase } from '@/lib/supabaseClient';
import HeroImage from '@/components/HeroImage';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
}

export default function Home() {
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [recentSummaries, setRecentSummaries] = useState<SummaryData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  // Fetch the most recent summaries for anonymous users on initial load
  useEffect(() => {
    async function fetchRecentSummaries() {
      try {
        // Only fetch for anonymous users
        if (!user) {
          const contentIds = getAnonymousGeneratedContentIds();

          // If there are previously generated summaries
          if (contentIds.length > 0) {
            // Get the 5 most recent content IDs (or all if fewer than 5)
            const recentContentIds = contentIds.slice(-5).reverse();

            // Fetch the summaries from the database
            const { data, error } = await supabase
              .from('summaries')
              .select('*')
              .in('content_id', recentContentIds)
              .order('content_created_at', { ascending: false });

            if (error) {
              console.error('Error fetching recent summaries:', error);
              return;
            }

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
              }));

              // Set the most recent summary as the main summary
              setSummaryData(formattedSummaries[0]);

              // Set all summaries for the recent list
              setRecentSummaries(formattedSummaries);
            }
          }
        }
      } catch (err) {
        console.error('Error loading recent summaries:', err);
      }
    }

    fetchRecentSummaries();
  }, [user]); // Re-run if user status changes

  const handleSubmit = async (url: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Extract video ID for local storage (for anonymous users)
      const contentId = extractYouTubeVideoId(url);

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
      };

      setSummaryData(formattedData);

      // For anonymous users, store content_id in local storage
      if (!user && contentId) {
        try {
          addAnonymousGeneratedContentId(contentId);
          console.log('Added to local storage history:', contentId);
        } catch (storageError) {
          console.error('Error storing in local storage:', storageError);
        }
      }
    } catch (err) {
      console.error('Error generating summary:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setSummaryData(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className='flex flex-col min-h-[calc(100vh-64px)]'>
      {/* Hero Section */}
      <section className='flex-1 flex flex-col lg:flex-row px-4 md:px-6 pt-8 pb-12 md:pt-12 md:pb-24 bg-gradient-to-br from-blue-50 to-purple-50'>
        <div className='flex-1 flex flex-col justify-center max-w-3xl mx-auto lg:mx-0 text-center lg:text-left'>
          <h1 className='text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6'>
            Get <span className='text-[#4263eb]'>Smart</span> with YouTube Content
          </h1>
          <p className='text-xl text-gray-600 mb-8 md:pr-12'>
            Transform lengthy videos into concise, digestible summaries. Save time and extract key
            insights in seconds.
          </p>

          <div className='w-full max-w-2xl mx-auto lg:mx-0 mb-8'>
            <YoutubeUrlInput
              onSubmit={handleSubmit}
              isLoading={isLoading}
              placeholder='Paste YouTube URL'
              buttonText='Generate Summary'
            />
            {error && <p className='mt-2 text-red-500 text-sm'>{error}</p>}
          </div>

          <div className='flex flex-wrap justify-center lg:justify-start gap-4 mt-2'>
            <Link href={user ? '/discover' : '/signup'}>
              <Button variant='outline' className='border-gray-200 hover:bg-gray-50'>
                {user ? 'Discover Content' : 'Create Free Account'}
                <ArrowRight className='ml-2 h-4 w-4' />
              </Button>
            </Link>
            <Link href='/about'>
              <Button
                variant='ghost'
                className='text-gray-600 hover:text-[#4263eb] hover:bg-blue-50'>
                Learn More
              </Button>
            </Link>
          </div>
        </div>

        <div className='flex-1 mt-12 lg:mt-0 flex justify-center lg:justify-end items-center'>
          <HeroImage />
        </div>
      </section>

      {/* Summary Card Section */}
      {summaryData && (
        <section className='py-16 px-4 bg-white'>
          <div className='max-w-7xl mx-auto'>
            <div className='flex justify-center'>
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
          </div>
        </section>
      )}

      {/* Recent Summaries Section for Anonymous Users */}
      {!user && recentSummaries.length > 1 && (
        <section className='py-12 px-4 bg-gray-50'>
          <div className='max-w-7xl mx-auto'>
            <h2 className='text-2xl font-bold text-gray-900 mb-6'>Your Recent Summaries</h2>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {recentSummaries.slice(1).map(summary => (
                <div
                  key={summary.id}
                  className='bg-white rounded-lg shadow-sm border border-gray-100 p-4'>
                  <h3 className='text-lg font-semibold mb-2 line-clamp-2'>{summary.title}</h3>
                  <p className='text-gray-600 text-sm mb-2'>
                    {summary.publisher_name} •{' '}
                    {new Date(summary.content_created_at).toLocaleDateString()}
                  </p>
                  <p className='text-gray-700 mb-3 line-clamp-3'>{summary.summary}</p>
                  <Link
                    href={`/summaries/${summary.content_id}`}
                    className='text-blue-600 hover:text-blue-800 text-sm font-medium'>
                    View full summary
                  </Link>
                </div>
              ))}
            </div>
            <div className='mt-6 text-center'>
              <Link href='/history'>
                <Button variant='outline' className='mt-4'>
                  View All History
                  <ArrowRight className='ml-2 h-4 w-4' />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className='py-16 px-4 bg-white'>
        <div className='max-w-7xl mx-auto'>
          <h2 className='text-3xl font-bold text-center mb-12'>Why Choose OnePlace?</h2>

          <div className='grid md:grid-cols-3 gap-8'>
            <div className='bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-xl'>
              <div className='w-12 h-12 bg-[#4263eb] rounded-full flex items-center justify-center mb-4'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  width='24'
                  height='24'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='white'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'>
                  <circle cx='12' cy='12' r='10'></circle>
                  <line x1='12' y1='16' x2='12' y2='12'></line>
                  <line x1='12' y1='8' x2='12.01' y2='8'></line>
                </svg>
              </div>
              <h3 className='text-xl font-semibold mb-2'>Save Time</h3>
              <p className='text-gray-600'>
                Get the key points from hour-long videos in just minutes, helping you consume
                content efficiently.
              </p>
            </div>

            <div className='bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-xl'>
              <div className='w-12 h-12 bg-[#4263eb] rounded-full flex items-center justify-center mb-4'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  width='24'
                  height='24'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='white'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'>
                  <polygon points='12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2'></polygon>
                </svg>
              </div>
              <h3 className='text-xl font-semibold mb-2'>Enhanced Comprehension</h3>
              <p className='text-gray-600'>
                Our AI extracts the most important information, making complex topics easier to
                understand.
              </p>
            </div>

            <div className='bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-xl'>
              <div className='w-12 h-12 bg-[#4263eb] rounded-full flex items-center justify-center mb-4'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  width='24'
                  height='24'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='white'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'>
                  <path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'></path>
                </svg>
              </div>
              <h3 className='text-xl font-semibold mb-2'>Secure & Private</h3>
              <p className='text-gray-600'>
                Your viewing history and summaries are private and secure, with optional account
                features for saving content.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
