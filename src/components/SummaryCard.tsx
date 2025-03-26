// src/components/SummaryCard.tsx - Component for displaying video summary information with tags and channel details
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Calendar, Tag, Users, ExternalLink, FileText, MessageCircle, BookOpen, X } from 'lucide-react';
import { SubscribeButton } from '@/components/SubscribeButton';
import ReactMarkdown from 'react-markdown';
import { GlowButton } from '@/components/ui/glow-button';
import { Components } from 'react-markdown';
import { Dialog, DialogOverlay, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { supabase } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';

// Custom DialogContent with no X button
const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "bg-background fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        className
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
DialogContent.displayName = 'DialogContent';

interface SummaryCardProps {
  title: string;
  date: string;
  channelName: string;
  channelId: string;
  summary: string;
  tags: string[];
  peopleMentioned: string[];
  videoId: string;
  isSubscribed?: boolean;
}

// Custom button component for detailed summary
interface DetailedSummaryButtonProps {
  videoId: string;
  children: React.ReactNode;
}

function DetailedSummaryButton({ videoId, children }: DetailedSummaryButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    // Store the flag in sessionStorage
    sessionStorage.setItem('showDetailedSummary', 'true');
    // Navigate to the chat page
    router.push(`/chat/${videoId}`);
  };

  return (
    <div onClick={handleClick} className='cursor-pointer'>
      {children}
    </div>
  );
}

// Custom button/overlay component for transcript display
interface TranscriptDialogProps {
  videoId: string;
  children: React.ReactNode;
}

function TranscriptDialog({ videoId, children }: TranscriptDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [formattedChunks, setFormattedChunks] = useState<string[]>([]);

  // Function to decode HTML entities
  const decodeHtmlEntities = (text: string) => {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  };

  // Pre-fetch transcript data when component mounts
  React.useEffect(() => {
    // Start with a small delay to not block other resources
    const timer = setTimeout(() => {
      fetchTranscript();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [videoId]);

  // Separate fetch function to be reusable
  const fetchTranscript = async () => {
    if (transcript) return;
    
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('summaries')
        .select('transcript')
        .eq('content_id', videoId)
        .single();

      if (error) throw error;
      
      if (data?.transcript) {
        // Store the transcript text directly
        setTranscript(data.transcript);
        
        // Process the transcript in a web worker or at least in the next tick
        // to avoid blocking the main thread
        setTimeout(() => {
          setFormattedChunks(formatTranscript(data.transcript));
        }, 0);
      } else {
        setError('No transcript data available');
      }
    } catch (err) {
      console.error('Error fetching transcript:', err);
      setError('Error loading transcript data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTranscript = () => {
    setIsOpen(true);
    if (!transcript) {
      fetchTranscript();
    }
  };

  // Split transcript into paragraphs (roughly) - optimized version
  const formatTranscript = (text: string) => {
    if (!text) return [];
    
    // Decode HTML entities like &#39; (apostrophe)
    const decodedText = decodeHtmlEntities(text);
    
    // Use a more efficient approach to chunking
    // Split by sentences but create chunks of roughly 500 chars
    // This avoids excessive regex operations and array manipulations
    const chunks: string[] = [];
    let currentChunk = '';
    let currentSize = 0;
    const chunkSize = 500;
    
    // Quick split by common sentence endings
    const sentences = decodedText.split(/(?<=[.!?])\s+/);
    
    for (const sentence of sentences) {
      if (currentSize + sentence.length > chunkSize) {
        chunks.push(currentChunk);
        currentChunk = sentence;
        currentSize = sentence.length;
      } else {
        if (currentChunk) currentChunk += ' ';
        currentChunk += sentence;
        currentSize += sentence.length + 1; // +1 for the space
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk);
    }
    
    return chunks;
  };

  // Memoize the paragraph rendering to avoid unnecessary re-renders
  const paragraphElements = React.useMemo(() => {
    return formattedChunks.map((paragraph, index) => (
      <p key={index} className="dark:text-white text-gray-900 leading-relaxed">
        {paragraph}
      </p>
    ));
  }, [formattedChunks]);

  return (
    <>
      <div onClick={handleOpenTranscript} className='cursor-pointer'>
        {children}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-full max-w-[calc(100%-2rem)] max-h-[90vh] overflow-hidden flex flex-col dark:bg-gray-950 bg-white sm:max-w-[90%] md:max-w-[85%] lg:max-w-[80%] xl:max-w-[75%] 2xl:max-w-[65%] border dark:border-gray-800/60 border-gray-200/90 shadow-xl">
          {/* Simplified header */}
          <div className="border-b dark:border-gray-800/40 border-gray-200/60 px-4 py-3">
            <DialogTitle className="text-lg font-bold dark:text-white text-gray-900">Full Transcript</DialogTitle>
            <DialogDescription className="dark:text-gray-300 text-gray-600 mt-0.5 text-sm">
              Complete transcript for this content
            </DialogDescription>
          </div>
          
          {/* Content with reduced padding */}
          <div className="flex-1 overflow-y-auto p-4 relative">
            <div className="absolute inset-0 dark:bg-grid-small-white/[0.01] bg-grid-small-black/[0.01] pointer-events-none"></div>
            <div className="relative z-10">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-40 gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent border-b-transparent dark:border-blue-500 border-blue-600"></div>
                  <p className="text-sm dark:text-gray-400 text-gray-500">Loading transcript...</p>
                </div>
              ) : error ? (
                <div className="dark:bg-red-900/20 bg-red-100 dark:text-red-400 text-red-600 p-3 rounded-md dark:border dark:border-red-800 border-red-200">
                  {error}
                </div>
              ) : formattedChunks.length > 0 ? (
                <div className="space-y-3">
                  {paragraphElements}
                </div>
              ) : transcript ? (
                <div className="space-y-3">
                  <p className="dark:text-white text-gray-900 leading-relaxed">
                    {transcript}
                  </p>
                </div>
              ) : (
                <div className="dark:bg-gray-800/50 bg-gray-100/70 rounded-lg p-4 dark:border-gray-800 border-gray-300 text-center">
                  <p className="dark:text-gray-400 text-gray-600">Transcript not available for this content.</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Simplified footer */}
          <div className="border-t dark:border-gray-800/40 border-gray-200/60 px-4 py-2 flex justify-end">
            <DialogClose asChild>
              <button className="rounded-md text-sm px-4 py-2 flex items-center justify-center bg-gradient-to-r dark:from-blue-900/80 dark:to-indigo-900/80 from-blue-500 to-indigo-500 text-white font-medium border dark:border-blue-800/50 border-blue-400/50 hover:opacity-90 transition-all duration-200 shadow-sm">
                Close
              </button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function SummaryCard({
  title,
  date,
  channelName,
  channelId,
  summary,
  tags = [],
  peopleMentioned = [],
  videoId,
  isSubscribed = false,
}: SummaryCardProps) {
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Custom renderer for markdown elements
  const customRenderers: Components = {
    // Display paragraphs with appropriate spacing
    p: ({ ...props }) => <div className='mb-4'>{props.children}</div>,

    // Display list items with less spacing
    li: ({ ...props }) => <li className='mb-2'>{props.children}</li>,

    // Handle blockquotes as regular paragraphs
    blockquote: ({ ...props }) => <div className='mb-4 font-medium'>{props.children}</div>,
  };

  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

  return (
    <div className='dark:bg-gray-900 bg-white rounded-xl shadow-lg border dark:border-gray-800 border-gray-200 dark:hover:border-gray-700 hover:border-gray-300 transition-all duration-300 overflow-hidden w-full mx-0 relative group'>
      {/* Subtle glow effect on hover */}
      <div className='absolute inset-0 bg-gradient-to-br dark:from-blue-500/10 dark:via-purple-500/5 from-blue-400/5 via-purple-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none -z-10'></div>

      <div className='p-4 md:p-6'>
        {/* Header section */}
        <div className='mb-5'>
          <div className='flex items-center justify-between mb-3'>
            <Link href={youtubeUrl} target='_blank' className='group inline-flex items-center'>
              <h2 className='text-xl md:text-2xl font-bold dark:text-white text-gray-900 leading-tight tracking-tight group-hover:text-blue-500 transition-colors duration-200'>
                {title}
              </h2>
              <ExternalLink
                size={16}
                className='ml-2 opacity-70 dark:text-white text-gray-700 group-hover:opacity-100 group-hover:text-blue-500 transition-colors duration-200'
              />
            </Link>
          </div>
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <div className='flex items-center'>
              <Link href={`/channels/${channelId}`} className='flex items-center group'>
                <span className='text-blue-400 font-medium group-hover:text-blue-300 transition-colors duration-200'>
                  {channelName}
                </span>
              </Link>
              <div className='h-4 w-[1px] dark:bg-gray-700 bg-gray-300 mx-3'></div>
              <div className='flex items-center text-sm dark:text-gray-400 text-gray-500'>
                <Calendar size={14} className='mr-1' />
                <span>{formattedDate}</span>
              </div>
            </div>
            <SubscribeButton channelId={channelId} initialIsSubscribed={isSubscribed} />
          </div>
        </div>

        {/* Summary content */}
        <div className='bg-gradient-to-br dark:from-gray-800/80 dark:to-gray-900/80 from-gray-100/80 to-gray-50/80 backdrop-blur-sm rounded-lg p-4 md:p-6 mb-5 border dark:border-gray-700/50 border-gray-200/70 relative'>
          {/* Subtle grid pattern overlay */}
          <div className='absolute inset-0 dark:bg-grid-small-white/[0.03] bg-grid-small-black/[0.03] rounded-lg pointer-events-none' />

          <div className='prose prose-sm max-w-none dark:text-gray-300 text-gray-700 leading-relaxed dark:prose-headings:text-gray-100 prose-headings:text-gray-900 prose-a:text-blue-500 dark:prose-a:text-blue-400 dark:prose-strong:text-white prose-strong:text-gray-900 prose-strong:font-semibold'>
            <ReactMarkdown components={customRenderers}>{summary}</ReactMarkdown>
          </div>
        </div>

        {/* Footer section */}
        <div className='flex flex-wrap items-start justify-between gap-4'>
          <div className='space-y-3 w-full md:w-auto'>
            {/* Tags */}
            {tags.length > 0 && (
              <div className='flex flex-wrap items-center gap-2'>
                <span className='flex items-center text-sm dark:text-gray-400 text-gray-600 mr-1'>
                  <Tag size={14} className='mr-1' />
                  Topics:
                </span>
                <div className='flex flex-wrap gap-1.5'>
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className='text-xs dark:bg-blue-900/30 bg-blue-100 dark:text-blue-300 text-blue-700 px-2.5 py-1 rounded-md border dark:border-blue-800/50 border-blue-200 font-medium transition-colors duration-200 dark:hover:bg-blue-800/40 hover:bg-blue-200 dark:hover:border-blue-700/50 hover:border-blue-300 cursor-default'>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* People mentioned */}
            {peopleMentioned.length > 0 && (
              <div className='flex flex-wrap items-center gap-2'>
                <span className='flex items-center text-sm dark:text-gray-400 text-gray-600 mr-1'>
                  <Users size={14} className='mr-1' />
                  People:
                </span>
                <div className='flex flex-wrap gap-1.5'>
                  {peopleMentioned.map((person, index) => (
                    <span
                      key={index}
                      className='text-xs dark:bg-purple-900/30 bg-purple-100 dark:text-purple-300 text-purple-700 px-2.5 py-1 rounded-md border dark:border-purple-800/50 border-purple-200 font-medium transition-colors duration-200 dark:hover:bg-purple-800/40 hover:bg-purple-200 dark:hover:border-purple-700/50 hover:border-purple-300 cursor-default'>
                      {person}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action buttons - Redesigned layout */}
          <div className='w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-0 dark:border-gray-800 border-gray-200'>
            <div className='flex flex-col sm:flex-row gap-2'>
              {/* Primary action */}
              <Link href={`/chat/${videoId}`} className='w-full sm:flex-1'>
                <GlowButton
                  glowColors={['#4263eb', '#3b5bdb', '#5c7cfa', '#748ffc']}
                  glowMode='breathe'
                  glowBlur='medium'
                  glowScale={1.5}
                  glowDuration={2.5}
                  className='whitespace-nowrap text-sm w-full px-4 py-2 flex items-center justify-center gap-1'>
                  <MessageCircle size={16} />
                  <span>Chat with video</span>
                </GlowButton>
              </Link>
              
              {/* Secondary actions */}
              <div className='flex flex-col sm:flex-row gap-2 w-full sm:w-auto'>
                <DetailedSummaryButton videoId={videoId}>
                  <button className='rounded-md text-sm px-3 py-2 flex items-center justify-center dark:bg-gray-800 bg-gray-100 dark:text-gray-200 text-gray-700 border dark:border-gray-700 border-gray-300 hover:dark:bg-gray-700 hover:bg-gray-200 transition-colors w-full whitespace-nowrap'>
                    <BookOpen size={16} className='mr-1' />
                    <span>Detailed Summary</span>
                  </button>
                </DetailedSummaryButton>

                <TranscriptDialog videoId={videoId}>
                  <button className='rounded-md text-sm px-3 py-2 flex items-center justify-center dark:bg-gray-800 bg-gray-100 dark:text-gray-200 text-gray-700 border dark:border-gray-700 border-gray-300 hover:dark:bg-gray-700 hover:bg-gray-200 transition-colors w-full whitespace-nowrap'>
                    <FileText size={16} className='mr-1' />
                    <span>Show Transcript</span>
                  </button>
                </TranscriptDialog>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
