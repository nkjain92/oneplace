// src/components/SummaryCard.tsx - Component for displaying video summary information with tags and channel details
'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, Tag, Users, ExternalLink } from 'lucide-react';
import { SubscribeButton } from '@/components/SubscribeButton';
import ReactMarkdown from 'react-markdown';
import { GlowButton } from '@/components/ui/glow-button';
import { Components } from 'react-markdown';

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
                <ExternalLink size={16} className='ml-2 inline-flex opacity-60 group-hover:opacity-100 transition-opacity' />
              </h2>
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

          {/* Action buttons */}
          <div className='mt-2 md:mt-0 self-end flex flex-col sm:flex-row gap-2'>
            <Link href={`/chat/${videoId}?prompt=${encodeURIComponent('Provide a detailed summary of this video with 10-12 key points. Include main arguments, important facts, and any significant conclusions. Organize the information in a clear, structured format.')}`}>
              <GlowButton
                glowColors={['#6366f1', '#4f46e5', '#818cf8', '#a5b4fc']}
                glowMode='breathe'
                glowBlur='medium'
                glowScale={1.5}
                glowDuration={2.5}>
                Show detailed summary
              </GlowButton>
            </Link>
            <Link href={`/chat/${videoId}`}>
              <GlowButton
                glowColors={['#4263eb', '#3b5bdb', '#5c7cfa', '#748ffc']}
                glowMode='breathe'
                glowBlur='medium'
                glowScale={1.5}
                glowDuration={2.5}>
                Chat with video
              </GlowButton>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
