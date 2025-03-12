// src/app/chat/[videoId]/page.tsx - Chat interface for Q&A with video transcripts
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import SummaryCard from '@/components/SummaryCard';
import { useChat } from '@ai-sdk/react';
import { ArrowUp } from 'lucide-react';
import { getChatSessionId } from '@/lib/localStorage';

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
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [textareaHeight, setTextareaHeight] = useState('auto');

  // Ref for the messages container to handle scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Ref for the input field to maintain focus
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize chat functionality
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    body: { videoId, sessionId },
  });

  // Initialize session ID on component mount
  useEffect(() => {
    setSessionId(getChatSessionId());
  }, []);

  // Memoized scroll function to improve performance
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Ensure input field focus is maintained
  useEffect(() => {
    // When loading state changes from true to false, refocus the input
    if (!isLoading) {
      textareaRef.current?.focus();
    }
  }, [isLoading]);

  // Handle textarea height adjustment
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleInputChange(e);

    // Reset height to auto to get the correct scrollHeight
    setTextareaHeight('auto');

    // Calculate new height based on content (with max height of 3 lines)
    const lineHeight = 24; // Approximate line height in pixels
    const maxHeight = lineHeight * 3; // Max height for 3 lines
    const scrollHeight = e.target.scrollHeight;

    // Set new height, capped at maxHeight
    setTextareaHeight(`${Math.min(scrollHeight, maxHeight)}px`);
  };

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

  // Custom submit handler that maintains focus
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(e);
    // Reset textarea height after submission
    setTextareaHeight('auto');
    // Immediately attempt to refocus - the useEffect will also help when streaming completes
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 10);
  };

  if (loading) return <div className='p-6 text-center'>Loading...</div>;
  if (error) return <div className='p-6 text-red-500'>Error: {error}</div>;
  if (!summaryData) return <div className='p-6 text-center'>Summary not found</div>;

  return (
    <div className='flex flex-col min-h-screen bg-gray-50'>
      <div className='p-6 max-w-7xl mx-auto w-full'>
        {/* Summary Card */}
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

        {/* Integrated Chat Interface - No fixed height container */}
        <div className='mt-4 bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden w-full'>
          {/* Chat Messages - No max-height or overflow */}
          <div className='p-4 space-y-4'>
            {messages.map(m => (
              <div
                key={m.id}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] p-3 rounded-2xl ${
                    m.role === 'user'
                      ? 'bg-[#4263eb] text-white rounded-tr-none'
                      : 'bg-gray-100 text-gray-800 rounded-tl-none'
                  }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {/* Empty div at the end for scrolling target */}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className='p-4 border-t border-gray-100 bg-white'>
            <form onSubmit={onSubmit} className='flex items-center gap-2'>
              <div className='flex-1 relative'>
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleTextareaChange}
                  placeholder='Ask a question about the video...'
                  className='w-full p-3 pl-4 pr-10 bg-gray-50 text-gray-800 rounded-full border border-gray-200 focus:outline-none focus:border-[#4263eb] focus:ring-1 focus:ring-[#4263eb] resize-none overflow-hidden'
                  style={{ height: textareaHeight }}
                  rows={1}
                  autoFocus
                />
              </div>
              <button
                type='submit'
                disabled={isLoading || !input.trim()}
                className={`p-3 rounded-full ${
                  isLoading || !input.trim()
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-[#4263eb] text-white hover:bg-[#3b5bdb]'
                } transition-colors duration-200`}
                aria-label='Send message'>
                <ArrowUp size={20} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
