'use client';

import { useState, useEffect } from 'react';
import { getAnonymousGeneratedContentIds } from '@/lib/localStorage';
import SummaryCard from './SummaryCard';
import { supabase } from '@/lib/supabaseClient';
import { FileText } from 'lucide-react';

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

// Helper function to safely validate a summary object
function isSummary(obj: unknown): obj is Summary {
  if (!obj || typeof obj !== 'object') return false;

  const requiredProps = [
    'id',
    'title',
    'content_created_at',
    'publisher_name',
    'publisher_id',
    'summary',
    'content_id',
  ];

  return requiredProps.every(prop => prop in obj);
}

export default function AnonymousHistoryLoader() {
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnonymousSummaries() {
      try {
        const contentIds = getAnonymousGeneratedContentIds();
        
        if (contentIds.length === 0) {
          setSummaries([]);
          setLoading(false);
          return;
        }

        const { data, error: fetchError } = await supabase
          .from('summaries')
          .select('*')
          .in('content_id', contentIds)
          .order('content_created_at', { ascending: false });

        if (fetchError) {
          console.error(`Error fetching summaries: ${fetchError.message}`);
          setError('Failed to load summaries. Please try again later.');
          setLoading(false);
          return;
        }

        // Safely convert to Summary[]
        setSummaries(data ? data.filter(isSummary) : []);
        setLoading(false);
      } catch (error) {
        console.error('Error accessing localStorage:', error);
        setError('Failed to access local storage. Please ensure cookies are enabled.');
        setLoading(false);
      }
    }

    fetchAnonymousSummaries();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
      {[...Array(3)].map((_, i) => (
    <div key={i} className="dark:bg-gray-900/50 bg-white rounded-xl p-6 dark:border dark:border-gray-800 border-gray-200">
      <div className="h-6 dark:bg-gray-800 bg-gray-300 rounded w-3/4 mb-4"></div>
      <div className="h-4 dark:bg-gray-800 bg-gray-300 rounded w-1/2 mb-2"></div>
      <div className="h-4 dark:bg-gray-800 bg-gray-300 rounded w-1/4 mb-4"></div>
      <div className="h-20 dark:bg-gray-800 bg-gray-300 rounded w-full"></div>
    </div>
  ))}
</div>
    );
  }

  if (error) {
    return (
      <div className="dark:bg-red-900/20 bg-red-100 dark:text-red-400 text-red-600 p-4 rounded-md dark:border dark:border-red-800 border-red-200">
      {error}
    </div>
    );
  }

  if (summaries.length === 0) {
    return (
      <div className="dark:bg-gray-900/50 bg-white backdrop-blur-sm rounded-xl p-6 dark:border dark:border-gray-800 border-gray-200 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br dark:from-gray-800 dark:to-gray-700 from-gray-100 to-gray-200 flex items-center justify-center">
            <FileText className="w-8 h-8 dark:text-gray-400 text-gray-500" />
          </div>
          <h3 className="text-xl font-semibold dark:text-white text-gray-800">No summaries in your history yet</h3>
          <p className="dark:text-gray-400 text-gray-600 max-w-md">
      Generate a summary from a YouTube video to see it here.
    </p>
  </div>
</div>
    );
  }

  return (
    <div className="space-y-6">
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
  );
}
