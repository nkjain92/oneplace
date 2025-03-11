// src/components/SummaryCard.tsx - Component for displaying video summary information with tags and channel details
'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Calendar, Tag, Users, Youtube } from 'lucide-react';
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
}: SummaryCardProps) {
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Custom renderer for markdown elements
  const customRenderers: Components = {
    // Display paragraphs with appropriate spacing
    p: ({ node, ...props }) => <div className='mb-4'>{props.children}</div>,

    // Display list items with less spacing
    li: ({ node, ...props }) => <li className='mb-2'>{props.children}</li>,

    // Handle blockquotes as regular paragraphs
    blockquote: ({ node, ...props }) => <div className='mb-4 font-medium'>{props.children}</div>,
  };

  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

  return (
    <div className='bg-white rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300 overflow-hidden w-full mx-0'>
      <div className='p-3 md:p-6'>
        {/* Header section */}
        <div className='mb-4'>
          <div className='flex items-center justify-between mb-2'>
            <Link href={youtubeUrl} target='_blank' className='group inline-flex items-center'>
              <h2 className='text-xl md:text-2xl font-bold text-gray-800 leading-tight tracking-tight group-hover:text-[#4263eb] transition-colors duration-200'>
                {title}
              </h2>
              <Youtube
                size={18}
                className='ml-2 text-gray-400 group-hover:text-[#4263eb] transition-colors duration-200'
              />
            </Link>
          </div>
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <div className='flex items-center'>
              <Link href={`/channels/${channelId}`} className='flex items-center group'>
                <span className='text-[#4263eb] font-medium group-hover:text-[#3b5bdb] transition-colors duration-200'>
                  {channelName}
                </span>
              </Link>
              <div className='h-4 w-[1px] bg-gray-300 mx-3'></div>
              <div className='flex items-center text-sm text-gray-500'>
                <Calendar size={14} className='mr-1' />
                <span>{formattedDate}</span>
              </div>
            </div>
            <SubscribeButton channelId={channelId} />
          </div>
        </div>

        {/* Summary content */}
        <div className='bg-gradient-to-br from-blue-50/50 to-gray-50 backdrop-blur-sm rounded-xl p-4 md:p-5 mb-4 border border-blue-100/30 shadow-sm'>
          <div className='prose prose-sm max-w-none text-gray-700 leading-relaxed prose-headings:text-gray-800 prose-a:text-[#4263eb] prose-strong:text-gray-900 prose-strong:font-semibold'>
            <ReactMarkdown components={customRenderers}>{summary}</ReactMarkdown>
          </div>
        </div>

        {/* Footer section */}
        <div className='flex flex-wrap items-start justify-between gap-4'>
          <div className='space-y-3 w-full md:w-auto'>
            {/* Tags */}
            {tags.length > 0 && (
              <div className='flex flex-wrap items-center gap-2'>
                <span className='flex items-center text-sm text-gray-600 mr-1'>
                  <Tag size={14} className='mr-1' />
                  Topics:
                </span>
                <div className='flex flex-wrap gap-1.5'>
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className='text-xs bg-blue-50 text-[#4263eb] px-2.5 py-1 rounded-full border border-blue-100 font-medium transition-colors duration-200 hover:bg-blue-100 hover:text-[#3b5bdb] cursor-default'>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* People mentioned */}
            {peopleMentioned.length > 0 && (
              <div className='flex flex-wrap items-center gap-2'>
                <span className='flex items-center text-sm text-gray-600 mr-1'>
                  <Users size={14} className='mr-1' />
                  People:
                </span>
                <div className='flex flex-wrap gap-1.5'>
                  {peopleMentioned.map((person, index) => (
                    <span
                      key={index}
                      className='text-xs bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full border border-purple-100 font-medium transition-colors duration-200 hover:bg-purple-100 hover:text-purple-800 cursor-default'>
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
