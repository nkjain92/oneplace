// src/components/SummaryCard.tsx - Component for displaying video summary information with tags and channel details
'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, Tag, Users } from 'lucide-react';
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
    <div className='bg-gray-900 rounded-xl shadow-lg border border-gray-800 hover:border-gray-700 transition-all duration-300 overflow-hidden w-full mx-0 relative group'>
      {/* Subtle glow effect on hover */}
      <div className='absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none -z-10'></div>

      <div className='p-4 md:p-6'>
        {/* Header section */}
        <div className='mb-5'>
          <div className='flex items-center justify-between mb-3'>
            <Link href={youtubeUrl} target='_blank' className='group inline-flex items-center'>
              <h2 className='text-xl md:text-2xl font-bold text-white leading-tight tracking-tight group-hover:text-blue-400 transition-colors duration-200'>
                {title}
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
              <div className='h-4 w-[1px] bg-gray-700 mx-3'></div>
              <div className='flex items-center text-sm text-gray-400'>
                <Calendar size={14} className='mr-1' />
                <span>{formattedDate}</span>
              </div>
            </div>
            <SubscribeButton channelId={channelId} initialIsSubscribed={isSubscribed} />
          </div>
        </div>

        {/* Summary content */}
        <div className='bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-lg p-4 md:p-6 mb-5 border border-gray-700/50 relative'>
          {/* Subtle grid pattern overlay */}
          <div className='absolute inset-0 bg-grid-small-white/[0.03] rounded-lg pointer-events-none' />

          <div className='prose prose-sm max-w-none text-gray-300 leading-relaxed prose-headings:text-gray-100 prose-a:text-blue-400 prose-strong:text-white prose-strong:font-semibold'>
            <ReactMarkdown components={customRenderers}>{summary}</ReactMarkdown>
          </div>
        </div>

        {/* Footer section */}
        <div className='flex flex-wrap items-start justify-between gap-4'>
          <div className='space-y-3 w-full md:w-auto'>
            {/* Tags */}
            {tags.length > 0 && (
              <div className='flex flex-wrap items-center gap-2'>
                <span className='flex items-center text-sm text-gray-400 mr-1'>
                  <Tag size={14} className='mr-1' />
                  Topics:
                </span>
                <div className='flex flex-wrap gap-1.5'>
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className='text-xs bg-blue-900/30 text-blue-300 px-2.5 py-1 rounded-md border border-blue-800/50 font-medium transition-colors duration-200 hover:bg-blue-800/40 hover:border-blue-700/50 cursor-default'>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* People mentioned */}
            {peopleMentioned.length > 0 && (
              <div className='flex flex-wrap items-center gap-2'>
                <span className='flex items-center text-sm text-gray-400 mr-1'>
                  <Users size={14} className='mr-1' />
                  People:
                </span>
                <div className='flex flex-wrap gap-1.5'>
                  {peopleMentioned.map((person, index) => (
                    <span
                      key={index}
                      className='text-xs bg-purple-900/30 text-purple-300 px-2.5 py-1 rounded-md border border-purple-800/50 font-medium transition-colors duration-200 hover:bg-purple-800/40 hover:border-purple-700/50 cursor-default'>
                      {person}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Talk to video button */}
          <div className='mt-2 md:mt-0 self-end'>
            <Link href={`/chat/${videoId}`}>
              <GlowButton
                glowColors={['#4263eb', '#3b5bdb', '#5c7cfa', '#748ffc']}
                glowMode='breathe'
                glowBlur='medium'
                glowScale={1.5}
                glowDuration={2.5}>
                Talk to this video
              </GlowButton>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
