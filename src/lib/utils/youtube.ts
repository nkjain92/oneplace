// src/lib/utils/youtube.ts - Utilities for YouTube URL validation and metadata extraction

/**
 * Extracts the YouTube video ID from various YouTube URL formats
 * @param url YouTube URL to extract ID from
 * @returns The video ID if valid, null otherwise
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;

  // Handle standard watch URLs
  // e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ
  const watchRegex = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|v\/)|youtu\.be\/)([\w-]+)/i;
  const watchMatch = url.match(watchRegex);
  if (watchMatch) return watchMatch[1];

  // Handle embed URLs
  // e.g., https://www.youtube.com/embed/dQw4w9WgXcQ
  const embedRegex = /youtube\.com\/embed\/([\w-]+)/i;
  const embedMatch = url.match(embedRegex);
  if (embedMatch) return embedMatch[1];

  // Handle legacy v URLs
  // e.g., https://www.youtube.com/v/dQw4w9WgXcQ
  const legacyRegex = /youtube\.com\/v\/([\w-]+)/i;
  const legacyMatch = url.match(legacyRegex);
  if (legacyMatch) return legacyMatch[1];

  // Handle shorts URLs
  // e.g., https://www.youtube.com/shorts/dQw4w9WgXcQ
  const shortsRegex = /youtube\.com\/shorts\/([\w-]+)/i;
  const shortsMatch = url.match(shortsRegex);
  if (shortsMatch) return shortsMatch[1];

  // Handle live URLs
  // e.g., https://www.youtube.com/live/dQw4w9WgXcQ
  const liveRegex = /youtube\.com\/live\/([\w-]+)/i;
  const liveMatch = url.match(liveRegex);
  if (liveMatch) return liveMatch[1];

  // No match found
  return null;
}

/**
 * Validates if a given URL is a valid YouTube URL with extractable video ID
 * @param url URL to validate
 * @returns true if URL is valid YouTube URL, false otherwise
 */
export function isValidYouTubeUrl(url: string): boolean {
  try {
    // Basic URL validation
    new URL(url);

    // Check if it's a YouTube URL and has a video ID
    return extractYouTubeVideoId(url) !== null;
  } catch {
    // URL is malformed
    return false;
  }
}

/**
 * Interface for YouTube metadata
 */
export interface YouTubeMetadata {
  videoId: string;
  videoUrl: string;
  embedUrl: string;
}

/**
 * Extracts metadata from a YouTube URL
 * @param url YouTube URL
 * @returns Object with video ID and formatted URLs, or null if invalid
 */
export function extractYouTubeMetadata(url: string): YouTubeMetadata | null {
  const videoId = extractYouTubeVideoId(url);

  if (!videoId) return null;

  return {
    videoId,
    videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
    embedUrl: `https://www.youtube.com/embed/${videoId}`,
  };
}
