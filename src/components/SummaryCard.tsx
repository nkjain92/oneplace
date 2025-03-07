'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Tag, Users } from 'lucide-react';
import { SubscribeButton } from '@/components/SubscribeButton';

interface SummaryCardProps {
  title: string;
  date: string;
  channelName: string;
  channelId: string;
  isSubscribed: boolean;
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
  isSubscribed = false,
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

  return (
    <div className='bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden max-w-4xl w-full'>
      <div className='p-6'>
        {/* Header section */}
        <div className='mb-4'>
          <h2 className='text-xl font-semibold text-gray-800 mb-1'>{title}</h2>
          <div className='flex items-center justify-between'>
            <div className='flex items-center text-sm text-gray-600'>
              {/* Link channel name to Channel page */}
              <span>
                <Link href={`/channels/${channelId}`}>{channelName}</Link>
              </span>
              <span className='mx-2'>•</span>
              <span>{formattedDate}</span>
            </div>
            <SubscribeButton channelId={channelId} />
          </div>
        </div>

        {/* Summary content */}
        <div className='bg-gray-50 rounded-lg p-5 mb-4'>
          <p className='text-gray-700 whitespace-pre-line'>{summary}</p>
        </div>

        {/* Footer section */}
        <div className='flex flex-wrap items-start justify-between'>
          <div className='space-y-2 w-full md:w-auto'>
            {/* Tags */}
            <div className='flex flex-wrap items-center gap-2'>
              <Tag size={16} className='text-gray-500' />
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className='text-sm bg-blue-50 text-blue-600 px-2 py-1 rounded-full'>
                  #{tag}
                </span>
              ))}
            </div>

            {/* People mentioned */}
            <div className='flex flex-wrap items-center gap-2'>
              <Users size={16} className='text-gray-500' />
              {peopleMentioned.map((person, index) => (
                <span
                  key={index}
                  className='text-sm bg-purple-50 text-purple-600 px-2 py-1 rounded-full'>
                  #{person}
                </span>
              ))}
            </div>
          </div>

          {/* Talk to video button */}
          <div className='mt-4 md:mt-0'>
            <Link href={`/chat/${videoId}`}>
              <Button
                variant='outline'
                className='text-[#4263eb] border-[#4263eb] hover:bg-blue-50 hover:text-[#3b5bdb]'>
                Talk to this video →
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
