// src/app/chat/[videoId]/page.tsx - Chat interface for Q&A with video transcripts
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import SummaryCard from '@/components/SummaryCard';
import { useChat } from '@ai-sdk/react';
import { ArrowUp } from 'lucide-react';
import { getChatSessionId } from '@/lib/localStorage';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';

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
  transcript?: string;
}

export default function ChatPage() {
  const params = useParams();
  const videoId = params.videoId as string;
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [textareaHeight, setTextareaHeight] = useState('auto');
  const [inputValue, setInputValue] = useState('');
  const [isInputTooLong, setIsInputTooLong] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Refs for DOM elements
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Initialize chat functionality
  const { messages, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    body: { videoId, sessionId },
    onFinish: () => {
      // Ensure we scroll to the bottom when a response is complete
      scrollToBottom();
      // Refocus the input field
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    },
  });

  // Initialize session ID on component mount
  useEffect(() => {
    setSessionId(getChatSessionId());

    // Check if device is mobile
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
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

  // Handle textarea height adjustment and character limit
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Check if input exceeds character limit
    if (value.length > 1000) {
      setIsInputTooLong(true);
      return;
    } else {
      setIsInputTooLong(false);
    }

    handleInputChange(e);

    // Reset height to auto to get the correct scrollHeight
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';

      // Calculate new height based on content (with max height of 10 lines)
      const lineHeight = 24; // Approximate line height in pixels
      const maxHeight = lineHeight * 10; // Max height for 10 lines
      const scrollHeight = textareaRef.current.scrollHeight;

      // Set new height, capped at maxHeight
      const newHeight = Math.min(scrollHeight, maxHeight);
      textareaRef.current.style.height = `${newHeight}px`;
      setTextareaHeight(`${newHeight}px`);
    }
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
          transcript: data.transcript,
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

  // Custom submit handler that maintains focus and handles mobile vs desktop behavior
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Don't submit if input is too long
    if (isInputTooLong || !inputValue.trim()) {
      return;
    }

    handleSubmit(e);
    setInputValue('');

    // Reset textarea height after submission
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      setTextareaHeight('auto');
    }

    // Immediately attempt to refocus
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 10);
  };

  // Handle key press events for the textarea
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // On mobile, Enter should create a new line
    // On desktop, Enter should submit, and Shift+Enter should create a new line
    if (e.key === 'Enter' && !e.shiftKey && !isMobile) {
      e.preventDefault();
      onSubmit(e);
    }
  };

  // Custom markdown components for styling
  const markdownComponents: Partial<Components> = {
    p: props => <p className='mb-2' {...props} />,
    ul: props => <ul className='list-disc pl-5 mb-2' {...props} />,
    ol: props => <ol className='list-decimal pl-5 mb-2' {...props} />,
    li: props => <li className='mb-1' {...props} />,
    h1: props => <h1 className='text-xl font-bold mb-2' {...props} />,
    h2: props => <h2 className='text-lg font-bold mb-2' {...props} />,
    h3: props => <h3 className='text-md font-bold mb-2' {...props} />,
    strong: props => <strong className='font-bold' {...props} />,
    em: props => <em className='italic' {...props} />,
    code: props => {
      const { className } = props;
      // Check if this is an inline code block (not wrapped in a pre)
      const isInline = !className || !className.includes('language-');
      return isInline ? (
        <code className='bg-gray-100 px-1 py-0.5 rounded font-mono text-sm' {...props} />
      ) : (
        <code className='bg-gray-100 p-2 rounded font-mono text-sm block' {...props} />
      );
    },
    pre: props => (
      <pre className='bg-gray-100 p-2 rounded font-mono text-sm mb-2 overflow-x-auto' {...props} />
    ),
  };

  if (loading) return <div className='p-6 text-center'>Loading...</div>;
  if (error) return <div className='p-6 text-red-500'>Error: {error}</div>;
  if (!summaryData) return <div className='p-6 text-center'>Summary not found</div>;

  return (
    <div className='flex flex-col min-h-screen bg-gray-50'>
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

      {/* Chat heading */}
      <h2 className='text-xl font-semibold mt-8 mb-2'>
        What do you want to ask about {summaryData.title}?
      </h2>

      {/* Empty space (15% of screen height) */}
      <div className='h-[5vh]'></div>

      {/* Chat container with fixed layout */}
      <div ref={chatContainerRef} className='w-full flex flex-col' style={{ minHeight: '300px' }}>
        {/* Messages container with scrolling */}
        <div
          ref={messagesContainerRef}
          className='flex-1 overflow-y-auto'
          style={{
            maxHeight: 'calc(100vh)',
          }}>
          <div className='space-y-4 pb-4'>
            {messages.map(m => (
              <div
                key={m.id}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'user' ? (
                  <div className='max-w-[85%] p-3 rounded-2xl shadow-sm border bg-gray-200 text-gray-800 rounded-tr-none border-gray-300'>
                    {m.content}
                  </div>
                ) : (
                  <div className='max-w-[85%] p-3 text-gray-800 prose prose-sm'>
                    <ReactMarkdown components={markdownComponents}>{m.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            ))}
            {/* Empty div at the end for scrolling target */}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Chat Input - Fixed position container */}
        <div className='w-full sticky bottom-0 bg-gray-50 pt-4' ref={inputContainerRef}>
          <form
            ref={formRef}
            onSubmit={onSubmit}
            className='flex items-end gap-2'
            style={{ minHeight: '56px' }}>
            <div className='flex-1 relative'>
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyPress}
                placeholder='Ask anything about the video'
                className={`w-full p-3 pl-4 pr-12 bg-white text-gray-800 rounded-lg border ${
                  isInputTooLong ? 'border-red-500' : 'border-gray-300'
                } shadow-md focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 resize-none overflow-auto`}
                style={{
                  height: textareaHeight,
                  maxHeight: '240px',
                  borderRadius: '8px',
                  transition: 'height 0.1s ease',
                }}
                rows={1}
                maxLength={1000}
                autoFocus
              />
              <button
                type='submit'
                disabled={isLoading || !inputValue.trim() || isInputTooLong}
                className={`absolute flex items-center justify-center h-8 w-8 rounded-full ${
                  isLoading || !inputValue.trim() || isInputTooLong
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-70'
                    : 'bg-gray-700 text-white hover:bg-gray-800 cursor-pointer'
                } transition-colors duration-200 shadow-md`}
                style={{
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
                aria-label='Send message'>
                <ArrowUp size={16} />
              </button>
            </div>
          </form>
          {isInputTooLong && (
            <p className='text-red-500 text-sm mt-1'>
              Please reduce your message to less than 1000 characters to chat.
            </p>
          )}
          {isMobile ? (
            <p className='text-xs text-gray-500 mt-1'>Press Enter for a new line</p>
          ) : (
            <p className='text-xs text-gray-500 mt-1'>
              Press Enter to send, Shift+Enter for a new line
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
