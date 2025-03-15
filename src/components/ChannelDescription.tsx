'use client'

import { useState } from 'react'

interface ChannelDescriptionProps {
  description: string
}

export default function ChannelDescription({ description }: ChannelDescriptionProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="relative">
      <p 
        className={`dark:text-gray-400 text-gray-600 mt-1 max-w-2xl ${
          !expanded ? 'line-clamp-3' : ''
        }`}
      >
        {description}
      </p>
      
      {description.length > 120 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="dark:text-blue-400 text-blue-600 dark:hover:text-blue-300 hover:text-blue-500 text-sm mt-1 font-medium transition-colors"
        >
          {expanded ? 'Read less' : 'Read more'}
        </button>
      )}
    </div>
  )
}
