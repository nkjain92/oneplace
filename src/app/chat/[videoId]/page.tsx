// src/app/chat/[videoId]/page.tsx - Chat interface for Q&A with video transcripts
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import SummaryCard from '@/components/SummaryCard';
import { useChat } from '@ai-sdk/react';
import { Button } from '@/components/ui/button';

interface SummaryData {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  featured_names: string[];
  publisher_name: string;
  publisher_id: string;
  content_created_at: string;
  videoId: string;
}

export default function ChatPage() {
  const params = useParams();
  const videoId = params.videoId as string;

  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSummary() {
      try {
        const { data, error } = await supabase
          .from('summaries')
          .select('*')
          .eq('content_id', videoId)
          .single();
        if (error) throw error;
        setSummaryData({
          id: data.id,
          title: data.title,
          summary: data.summary,
          tags: data.tags || [],
          featured_names: data.featured_names || [],
          publisher_name: data.publisher_name,
          publisher_id: data.publisher_id,
          content_created_at: data.content_created_at,
          videoId: data.content_id,
        });
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : 'An error occurred while fetching the summary';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }
    fetchSummary();
  }, [videoId]);

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    body: { videoId },
  });

  if (loading) return <div className='p-6 text-center'>Loading...</div>;
  if (error) return <div className='p-6 text-red-500'>Error: {error}</div>;
  if (!summaryData) return <div className='p-6 text-center'>Summary not found</div>;

  return (
    <div className='flex flex-col min-h-screen bg-gray-50'>
      <div className='p-6'>
        <SummaryCard
          title={summaryData.title}
          date={summaryData.content_created_at}
          channelName={summaryData.publisher_name}
          channelId={summaryData.publisher_id}
          summary={summaryData.summary}
          tags={summaryData.tags}
          peopleMentioned={summaryData.featured_names}
          videoId={summaryData.videoId}
        />
      </div>
      <div className='flex-1 p-6'>
        <div className='max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-4'>
          <div className='space-y-4 mb-4 max-h-[50vh] overflow-y-auto'>
            {messages.map(m => (
              <div
                key={m.id}
                className={`p-3 rounded-lg ${
                  m.role === 'user' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                }`}>
                <strong>{m.role === 'user' ? 'You: ' : 'Assistant: '}</strong>
                {m.content}
              </div>
            ))}
          </div>
          <form onSubmit={handleSubmit} className='flex gap-2'>
            <input
              type='text'
              value={input}
              onChange={handleInputChange}
              placeholder='Ask a question about the video...'
              className='flex-1 p-2 border border-gray-200 rounded focus:outline-none focus:border-[#4263eb]'
              disabled={isLoading}
            />
            <Button
              type='submit'
              disabled={isLoading}
              className='bg-[#4263eb] hover:bg-[#3b5bdb] text-white'>
              {isLoading ? 'Sending...' : 'Send'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
