import { SubscribeButton } from '@/components/SubscribeButton';

interface ChannelCardProps {
  id: string;
  name: string;
  description: string;
}

export function ChannelCard({ id, name, description }: ChannelCardProps) {
  return (
    <div className='p-4 border rounded-md bg-white shadow-sm border-gray-100'>
      <h3 className='text-lg font-semibold text-gray-900'>{name}</h3>
      <p className='text-sm text-gray-600 mt-1'>{description}</p>
      <div className='mt-2'>
        <SubscribeButton channelId={id} />
      </div>
    </div>
  );
}
