// src/components/ChannelCard.tsx - Modern, elegant channel card component with subscription button
'use client'

import { SubscribeButton } from '@/components/SubscribeButton';
import Image from 'next/image';
import { Users, ExternalLink, Film } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ChannelCardProps {
  id: string;
  name: string;
  description: string;
  image?: string;
  thumbnail?: string;
  subscriberCount?: number;
  contentCount?: number;
  isSubscribed?: boolean;
}

export function ChannelCard({
  id,
  name,
  description,
  image,
  thumbnail,
  subscriberCount,
  contentCount,
  isSubscribed = false,
}: ChannelCardProps) {
  // Use thumbnail if available, fallback to provided image, or default to placeholder
  const imageUrl = thumbnail || image || '/images/channel-placeholder.jpg';
  const router = useRouter();

  // Handle card click to navigate to channel page
  const handleCardClick = () => {
    router.push(`/channels/${id}`);
  };

  return (
    <div
      className='overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 dark:bg-gray-900 bg-white border dark:border-gray-800 border-gray-200 dark:hover:border-gray-700 hover:border-gray-300 cursor-pointer group relative'
      onClick={handleCardClick}>
      {/* Subtle glow effect on hover */}
      <div className='absolute inset-0 bg-gradient-to-br dark:from-blue-500/5 dark:to-purple-500/5 from-blue-300/10 to-purple-300/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none'></div>

      {/* Channel Image with gradient overlay */}
      <div className='h-40 dark:bg-gradient-to-r dark:from-gray-900 dark:to-gray-800 bg-gradient-to-r from-gray-100 to-gray-200 relative'>
        <Image
          src={imageUrl}
          alt={name}
          fill
          className='object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-300'
          sizes='(max-width: 768px) 100vw, 33vw'
        />
        {/* Add grid pattern overlay */}
        <div className='absolute inset-0 dark:bg-grid-small-white/[0.03] bg-grid-small-black/[0.03]'></div>
        {/* Gradient overlay */}
        <div className='absolute inset-0 dark:bg-gradient-to-b dark:from-transparent dark:via-black/30 dark:to-gray-900/90 bg-gradient-to-b from-transparent via-white/10 to-white/70'></div>
      </div>

      {/* Content */}
      <div className='p-5 z-10 relative'>
        <div className='flex justify-between items-start'>
          <div>
            <h3 className='text-lg font-semibold dark:text-white text-gray-900 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors'>
              {name}
            </h3>

            <div className='flex items-center gap-4 mt-2'>
              {/* Only show subscriber count if it's greater than zero */}
              {subscriberCount !== undefined && subscriberCount > 0 && (
                <div className='flex items-center text-sm dark:text-gray-400 text-gray-500'>
                  <Users size={14} className='mr-1' />
                  <span>
                    {subscriberCount.toLocaleString()}{' '}
                    {subscriberCount === 1 ? 'subscriber' : 'subscribers'}
                  </span>
                </div>
              )}

              {/* Show content count if available */}
              {contentCount !== undefined && contentCount > 0 && (
                <div className='flex items-center text-sm dark:text-gray-400 text-gray-500'>
                  <Film size={14} className='mr-1' />
                  <span>
                    {contentCount.toLocaleString()} {contentCount === 1 ? 'video' : 'videos'}
                  </span>
                </div>
              )}
            </div>

            <p className='text-sm dark:text-gray-400 text-gray-500 mt-3 line-clamp-2'>{description}</p>
          </div>
        </div>

        <div className='mt-5 flex justify-between items-center'>
          {/* Use onClick with stopPropagation to prevent the card click from being triggered */}
          <div onClick={e => e.stopPropagation()}>
            <SubscribeButton channelId={id} initialIsSubscribed={isSubscribed} />
          </div>

          {/* External link with stopPropagation to prevent the card click from being triggered */}
          <a
            href={`https://youtube.com/channel/${id}`}
            target='_blank'
            rel='noopener noreferrer'
            onClick={e => e.stopPropagation()}
            className='dark:text-gray-400 text-gray-500 dark:hover:text-blue-400 hover:text-blue-500 transition-colors'
            title={`Visit ${name} on YouTube`}
            aria-label={`Visit ${name} on YouTube`}>
            <ExternalLink size={18} />
          </a>
        </div>
      </div>
    </div>
  );
}
