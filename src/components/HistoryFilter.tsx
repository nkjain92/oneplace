//src/components/HistoryFilter.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

type FilterType = 'all' | 'generated';

interface HistoryFilterProps {
  initialFilter: FilterType;
  userId?: string;
  filter?: FilterType;
}

export default function HistoryFilter({ initialFilter, userId, filter: propFilter }: HistoryFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState<FilterType>(propFilter || initialFilter);

  // Update URL when filter changes, but only if it's different from the URL parameter
  useEffect(() => {
    const currentFilter = searchParams.get('filter') as FilterType || 'all';
    
    // Only update URL if the filter has changed to prevent infinite rerenders
    if (filter !== currentFilter) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('filter', filter);
      router.replace(`/history?${params.toString()}`);
    }
  }, [filter, router, searchParams]);

  // Only show filter if user is logged in
  if (!userId) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='outline'
          className='rounded-full dark:bg-gray-900 bg-gray-100 dark:border-gray-800 border-gray-300 dark:hover:bg-gray-800 hover:bg-gray-200 flex items-center hover:cursor-pointer dark:text-gray-300 text-gray-700'>
          {filter === 'generated' ? 'Generated by me' : 'All summaries'}
          <ChevronDown className='ml-2 h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='dark:bg-gray-900 bg-white rounded-lg shadow-lg py-2 z-[200] dark:border-gray-800 border-gray-200'>
        <DropdownMenuItem
          onClick={() => setFilter('all')}
          className='flex items-center px-4 py-2 text-sm dark:text-gray-300 text-gray-700 dark:hover:bg-gray-800 hover:bg-gray-100 hover:cursor-pointer'>
          All summaries
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setFilter('generated')}
          className='flex items-center px-4 py-2 text-sm dark:text-gray-300 text-gray-700 dark:hover:bg-gray-800 hover:bg-gray-100 hover:cursor-pointer'>
          Generated by me
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
