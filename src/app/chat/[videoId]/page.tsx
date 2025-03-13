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

  // Flag to decide if auto-scrolling should occur
  const isAutoScrollingRef = useRef(true);

  // Initialize chat functionality
  const { messages, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    body: { videoId, sessionId },
    onFinish: () => {
      scrollToBottom(true); // Force scroll to bottom when response is complete
      // Refocus the textarea so the cursor stays in the input box
      textareaRef.current?.focus();
    },
  });

  // Initialize session ID and mobile check
  useEffect(() => {
    setSessionId(getChatSessionId());
    const checkIfMobile = () => setIsMobile(window.innerWidth <= 768);
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Scroll to bottom function using the end anchor
  const scrollToBottom = useCallback((force = false) => {
    if (isAutoScrollingRef.current || force) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Detect scroll position to control auto-scrolling
  useEffect(() => {
    const messagesContainer = messagesContainerRef.current;
    if (!messagesContainer) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
      // Consider within 100px of bottom as "at bottom"
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
      isAutoScrollingRef.current = isAtBottom;
    };
    messagesContainer.addEventListener('scroll', handleScroll, { passive: true });
    return () => messagesContainer.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to bottom when messages change (i.e. on streaming updates)
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  // Handle textarea change, adjust height and check character limit
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputValue(value);
    if (value.length > 1000) {
      setIsInputTooLong(true);
      return;
    } else {
      setIsInputTooLong(false);
    }
    handleInputChange(e);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 200;
      if (scrollHeight <= maxHeight) {
        textareaRef.current.style.height = `${scrollHeight}px`;
        setTextareaHeight(`${scrollHeight}px`);
      } else {
        textareaRef.current.style.height = `${maxHeight}px`;
        setTextareaHeight(`${maxHeight}px`);
      }
    }
  };

  // Fetch summary and transcript data
  useEffect(() => {
    async function fetchSummary() {
      if (!videoId) return;
      setLoading(true);
      try {
        const { data, error: summaryError } = await supabase
          .from('summaries')
          .select('*')
          .eq('content_id', videoId)
          .single();

        if (summaryError) throw summaryError;
        setSummaryData({
          id: data.id,
          title: data.title || 'Untitled Video',
          summary: data.summary || 'No summary available',
          tags: Array.isArray(data.tags) ? data.tags : [],
          featured_names: Array.isArray(data.featured_names) ? data.featured_names : [],
          publisher_name: data.publisher_name || 'Unknown Channel',
          publisher_id: data.publisher_id || '',
          content_created_at: data.content_created_at || new Date().toISOString(),
          videoId: videoId,
          transcript: data.transcript,
        });
      } catch (err) {
        console.error('Error fetching summary:', err);
        setError('Failed to load video information');
      } finally {
        setLoading(false);
      }
    }
    fetchSummary();
  }, [videoId]);

  // Custom form submission handler
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isInputTooLong || inputValue.trim() === '') return;
    // Optionally reset the textarea height after submission
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      setTextareaHeight('auto');
    }
    handleSubmit(e);
    setInputValue(''); // Clear input after sending
  };

  // Handle keyboard shortcut for sending message
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e);
    }
  };

  // Custom renderer for markdown elements
  const markdownRenderers: Components = {
    p: ({ children }) => <p className='mb-4 last:mb-0'>{children}</p>,
    a: ({ href, children }) => (
      <a
        href={href}
        target='_blank'
        rel='noopener noreferrer'
        className='text-blue-400 hover:underline'>
        {children}
      </a>
    ),
    ol: ({ children }) => <ol className='list-decimal pl-6 mb-4'>{children}</ol>,
    ul: ({ children }) => <ul className='list-disc pl-6 mb-4'>{children}</ul>,
    li: ({ children }) => <li className='mb-1'>{children}</li>,
    code: ({ children }) => <code className='bg-gray-800 rounded px-1 py-0.5'>{children}</code>,
    pre: ({ children }) => (
      <pre className='bg-gray-800 rounded p-3 mb-4 overflow-x-auto text-sm'>{children}</pre>
    ),
    h1: ({ children }) => <h1 className='text-xl font-bold mb-4 text-white'>{children}</h1>,
    h2: ({ children }) => <h2 className='text-lg font-bold mb-3 text-white'>{children}</h2>,
    h3: ({ children }) => <h3 className='text-md font-bold mb-3 text-white'>{children}</h3>,
  };

  if (loading) {
    return (
      <div className='min-h-[calc(100vh-64px)] bg-black flex flex-col'>
        <div className='mx-auto px-4 py-8 w-full max-w-4xl'>
          <div className='h-12 bg-gray-800 rounded-lg animate-pulse mb-8'></div>
          <div className='space-y-4'>
            {[...Array(3)].map((_, i) => (
              <div key={i} className='h-20 bg-gray-800 rounded-lg animate-pulse'></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-[calc(100vh-64px)] bg-black'>
        <div className='max-w-7xl mx-auto px-4 py-8'>
          <div className='bg-red-900/20 border border-red-800 text-red-400 p-4 rounded-md'>
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col min-h-[calc(100vh-64px)] bg-black'>
      {/* Summary Section */}
      <div className='w-full max-w-7xl mx-auto px-4 md:px-6 py-6'>
        {summaryData && (
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
        )}
      </div>

      {/* Chat Interface */}
      <div
        ref={chatContainerRef}
        className='flex-1 flex flex-col w-full max-w-4xl mx-auto px-4 md:px-6 relative'>
        {/* Messages Container */}
        <div
          ref={messagesContainerRef}
          className='flex-1 overflow-y-auto space-y-4 mb-4 border-t border-gray-800 pt-4'>
          {messages.length === 0 ? (
            <div className='text-center p-8'>
              <p className='text-gray-400 mb-2'>
                Ask a question about this video to start a conversation
              </p>
              <p className='text-gray-500 text-sm'>
                You can ask about specific moments, themes, or get clarification on anything
                mentioned in the video
              </p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-3 text-white ${
                    message.role === 'user'
                      ? 'bg-blue-600 rounded-br-none'
                      : 'bg-gray-800 rounded-bl-none'
                  }`}>
                  {message.role === 'assistant' ? (
                    <div className='prose prose-invert prose-sm max-w-none'>
                      <ReactMarkdown components={markdownRenderers}>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div>{message.content}</div>
                  )}
                </div>
              </div>
            ))
          )}
          {/* Anchor element for auto-scrolling */}
          <div ref={messagesEndRef} />
          <div className='h-64'></div>
        </div>

        {/* Input Area */}
        <div
          ref={inputContainerRef}
          className='fixed bottom-0 left-0 right-0 w-full bg-gradient-to-t from-black via-black to-transparent py-4 z-50'>
          <div className='w-full max-w-4xl mx-auto px-4 md:px-6'>
            <form
              ref={formRef}
              onSubmit={onSubmit}
              className='relative border border-gray-800 bg-gray-900 rounded-xl'>
              {/* The textarea is now always enabled so the user can type while streaming */}
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyPress}
                placeholder='Ask a question about this video...'
                className='w-full resize-none bg-transparent py-3 pl-4 pr-12 text-white focus:outline-none focus:ring-0 placeholder:text-gray-500'
                style={{ height: textareaHeight }}
              />
              <button
                type='submit'
                disabled={isLoading || isInputTooLong || inputValue.trim() === ''}
                className={`absolute right-2 bottom-3 p-1.5 rounded-full ${
                  isLoading || isInputTooLong || inputValue.trim() === ''
                    ? 'bg-gray-700 text-gray-400'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                } transition-colors`}
                aria-label='Send message'>
                <ArrowUp size={16} />
              </button>
            </form>
            <div className='min-h-[1.5rem] mt-1'>
              {isInputTooLong && (
                <div className='text-xs text-red-400 px-2'>
                  Message is too long. Please keep it under 1000 characters.
                </div>
              )}
              {isLoading && <div className='text-xs text-gray-400 px-2'>Thinking...</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
