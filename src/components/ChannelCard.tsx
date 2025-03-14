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
}

export function ChannelCard({
  id,
  name,
  description,
  image,
  thumbnail,
  subscriberCount,
  contentCount,
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
      className='overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 bg-gray-900 border border-gray-800 hover:border-gray-700 cursor-pointer group relative'
      onClick={handleCardClick}>
      {/* Subtle glow effect on hover */}
      <div className='absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none'></div>

      {/* Channel Image with gradient overlay */}
      <div className='h-40 bg-gradient-to-r from-gray-900 to-gray-800 relative'>
        <Image
          src={imageUrl}
          alt={name}
          fill
          className='object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-300'
          sizes='(max-width: 768px) 100vw, 33vw'
        />
        {/* Add grid pattern overlay */}
        <div className='absolute inset-0 bg-grid-small-white/[0.03]'></div>
        {/* Gradient overlay */}
        <div className='absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-gray-900/90'></div>
      </div>

      {/* Content */}
      <div className='p-5 z-10 relative'>
        <div className='flex justify-between items-start'>
          <div>
            <h3 className='text-lg font-semibold text-white group-hover:text-blue-400 transition-colors'>
              {name}
            </h3>

            <div className='flex items-center gap-4 mt-2'>
              {/* Only show subscriber count if it's greater than zero */}
              {subscriberCount !== undefined && subscriberCount > 0 && (
                <div className='flex items-center text-sm text-gray-400'>
                  <Users size={14} className='mr-1' />
                  <span>
                    {subscriberCount.toLocaleString()}{' '}
                    {subscriberCount === 1 ? 'subscriber' : 'subscribers'}
                  </span>
                </div>
              )}

              {/* Show content count if available */}
              {contentCount !== undefined && contentCount > 0 && (
                <div className='flex items-center text-sm text-gray-400'>
                  <Film size={14} className='mr-1' />
                  <span>
                    {contentCount.toLocaleString()} {contentCount === 1 ? 'video' : 'videos'}
                  </span>
                </div>
              )}
            </div>

            <p className='text-sm text-gray-400 mt-3 line-clamp-2'>{description}</p>
          </div>
        </div>

        <div className='mt-5 flex justify-between items-center'>
          {/* Use onClick with stopPropagation to prevent the card click from being triggered */}
          <div onClick={e => e.stopPropagation()}>
            <SubscribeButton channelId={id} />
          </div>

          {/* External link with stopPropagation to prevent the card click from being triggered */}
          <a
            href={`https://youtube.com/channel/${id}`}
            target='_blank'
            rel='noopener noreferrer'
            onClick={e => e.stopPropagation()}
            className='text-gray-400 hover:text-blue-400 transition-colors'>
            <ExternalLink size={18} />
          </a>
        </div>
      </div>
    </div>
  );
}
