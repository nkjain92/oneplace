'use client';

import { useState } from 'react';
import { YoutubeUrlInput } from '@/components/YoutubeUrlInput';
import SummaryCard from '@/components/SummaryCard';
import { useAuthStore } from '@/store/authStore';
import { extractYouTubeVideoId } from '@/lib/utils/youtube';
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

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
          const storedSummaries = JSON.parse(localStorage.getItem('user_summaries') || '[]');
          if (!storedSummaries.includes(contentId)) {
            storedSummaries.push(contentId);
            localStorage.setItem('user_summaries', JSON.stringify(storedSummaries));
            console.log('Added to local storage history:', contentId);
          }
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
                isSubscribed={false}
                summary={summaryData.summary}
                tags={summaryData.tags}
                peopleMentioned={summaryData.featured_names}
                videoId={summaryData.videoId || summaryData.content_id || ''}
              />
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className='py-16 px-4 bg-white'>
        <div className='max-w-7xl mx-auto'>
          <h2 className='text-3xl font-bold text-center mb-12'>Why Choose GetSmart?</h2>

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
