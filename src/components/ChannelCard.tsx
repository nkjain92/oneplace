// src/components/ChannelCard.tsx - Modern, elegant channel card component with subscription button
import { SubscribeButton } from '@/components/SubscribeButton';
import Link from 'next/link';
import Image from 'next/image';
import { Users, ExternalLink, Film } from 'lucide-react';

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

  return (
    <div className='overflow-hidden rounded-xl shadow-md hover:shadow-lg transition-all duration-300 bg-white border border-gray-100'>
      {/* Channel Image */}
      <div className='h-40 bg-gradient-to-r from-primary/5 to-accent/5 relative'>
        <Image
          src={imageUrl}
          alt={name}
          fill
          className='object-cover'
          sizes='(max-width: 768px) 100vw, 33vw'
        />
        <div className='absolute inset-0 bg-gradient-to-t from-black/30 to-transparent'></div>
      </div>

      {/* Content */}
      <div className='p-5'>
        <div className='flex justify-between items-start'>
          <div>
            <Link href={`/channels/${id}`} className='group'>
              <h3 className='text-lg font-semibold text-gray-900 group-hover:text-primary transition-colors'>
                {name}
              </h3>
            </Link>

            <div className='flex items-center gap-4 mt-1'>
              {/* Only show subscriber count if it's greater than zero */}
              {subscriberCount !== undefined && subscriberCount > 0 && (
                <div className='flex items-center text-sm text-gray-500'>
                  <Users size={14} className='mr-1' />
                  <span>
                    {subscriberCount.toLocaleString()}{' '}
                    {subscriberCount === 1 ? 'subscriber' : 'subscribers'}
                  </span>
                </div>
              )}

              {/* Show content count if available */}
              {contentCount !== undefined && contentCount > 0 && (
                <div className='flex items-center text-sm text-gray-500'>
                  <Film size={14} className='mr-1' />
                  <span>
                    {contentCount.toLocaleString()} {contentCount === 1 ? 'video' : 'videos'}
                  </span>
                </div>
              )}
            </div>

            <p className='text-sm text-gray-600 mt-2 line-clamp-2'>{description}</p>
          </div>
        </div>

        <div className='mt-5 flex justify-between items-center'>
          <SubscribeButton channelId={id} />

          <Link
            href={`https://youtube.com/channel/${id}`}
            target='_blank'
            rel='noopener noreferrer'
            className='text-gray-500 hover:text-primary transition-colors'>
            <ExternalLink size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
}
