'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthProvider';

export default function Home() {
  const { user, loading } = useAuth();
  const [youtubeLink, setYoutubeLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // This will be implemented in a future step when we add summary generation functionality
    console.log('Generating summary for:', youtubeLink);

    // Reset for now
    setTimeout(() => {
      setIsSubmitting(false);
      setYoutubeLink('');
    }, 1500);
  };

  return (
    <div className='min-h-screen'>
      {/* Hero Section for non-authenticated users */}
      {!loading && !user && (
        <section className='py-12 md:py-16 text-center'>
          <h1 className='text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent'>
            Smart Summaries for YouTube
          </h1>
          <p className='text-xl text-gray-600 max-w-2xl mx-auto mb-8'>
            Generate concise summaries for any YouTube video and interact with the content through
            Q&A.
          </p>
        </section>
      )}

      {/* YouTube Link Input Section */}
      <section className='max-w-2xl mx-auto mb-16'>
        <div className='bg-white p-6 rounded-lg shadow-md border-2 border-transparent hover:border-blue-200 transition-all'>
          <h2 className='text-xl font-semibold mb-4'>
            {user ? 'Generate a new summary' : 'Try it now'}
          </h2>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='flex flex-col md:flex-row gap-4'>
              <input
                type='url'
                placeholder='Enter YouTube URL'
                value={youtubeLink}
                onChange={e => setYoutubeLink(e.target.value)}
                className='flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                required
              />
              <button
                type='submit'
                disabled={isSubmitting}
                className={`px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${
                  isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                }`}>
                {isSubmitting ? 'Generating...' : 'Generate Summary'}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Placeholder for summaries - will be implemented later */}
      <section className='max-w-5xl mx-auto'>
        <h2 className='text-2xl font-semibold mb-6'>
          {user ? 'Your Recent Summaries' : 'Recently Generated Summaries'}
        </h2>
        <div className='p-8 text-center text-gray-500 border border-gray-200 rounded-lg'>
          <p>No summaries yet. Generate your first one above!</p>
        </div>
      </section>
    </div>
  );
}
