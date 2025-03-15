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
        className={`text-gray-400 mt-1 max-w-2xl ${
          !expanded ? 'line-clamp-3' : ''
        }`}
      >
        {description}
      </p>
      
      {description.length > 120 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-blue-400 hover:text-blue-300 text-sm mt-1 font-medium transition-colors"
        >
          {expanded ? 'Read less' : 'Read more'}
        </button>
      )}
    </div>
  )
}
