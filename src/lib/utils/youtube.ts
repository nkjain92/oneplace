// src/lib/utils/youtube.ts - Utilities for YouTube URL validation and metadata extraction

/**
 * Extracts the YouTube video ID from various YouTube URL formats
 * @param url YouTube URL to extract ID from
 * @returns The video ID if valid, null otherwise
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;

  // Normalize the URL - trim spaces and add https:// if missing
  let normalizedUrl = url.trim();
  if (!normalizedUrl.match(/^https?:\/\//i)) {
    normalizedUrl = 'https://' + normalizedUrl;
  }

  try {
    // Try to construct a URL to validate basic structure
    // This will throw an error if completely invalid
    new URL(normalizedUrl);

    // Handle standard watch URLs
    // e.g., youtube.com/watch?v=dQw4w9WgXcQ or www.youtube.com/watch?v=dQw4w9WgXcQ
    const watchRegex = /(?:(?:www\.)?youtube\.com\/(?:watch\?(?:.*&)?v=|v\/)|youtu\.be\/)([\w-]+)/i;
    const watchMatch = normalizedUrl.match(watchRegex);
    if (watchMatch) return watchMatch[1];

    // Handle embed URLs
    // e.g., youtube.com/embed/dQw4w9WgXcQ
    const embedRegex = /(?:www\.)?youtube\.com\/embed\/([\w-]+)/i;
    const embedMatch = normalizedUrl.match(embedRegex);
    if (embedMatch) return embedMatch[1];

    // Handle legacy v URLs
    // e.g., youtube.com/v/dQw4w9WgXcQ
    const legacyRegex = /(?:www\.)?youtube\.com\/v\/([\w-]+)/i;
    const legacyMatch = normalizedUrl.match(legacyRegex);
    if (legacyMatch) return legacyMatch[1];

    // Handle shorts URLs
    // e.g., youtube.com/shorts/dQw4w9WgXcQ
    const shortsRegex = /(?:www\.)?youtube\.com\/shorts\/([\w-]+)/i;
    const shortsMatch = normalizedUrl.match(shortsRegex);
    if (shortsMatch) return shortsMatch[1];

    // Handle live URLs
    // e.g., youtube.com/live/dQw4w9WgXcQ
    const liveRegex = /(?:www\.)?youtube\.com\/live\/([\w-]+)/i;
    const liveMatch = normalizedUrl.match(liveRegex);
    if (liveMatch) return liveMatch[1];

    // No match found
    return null;
  } catch {
    // URL is completely malformed
    return null;
  }
}

/**
 * Validates if a given URL is a valid YouTube URL with extractable video ID
 * @param url URL to validate
 * @returns true if URL is valid YouTube URL, false otherwise
 */
export function isValidYouTubeUrl(url: string): boolean {
  // Check if it's a YouTube URL and has a video ID
  return extractYouTubeVideoId(url) !== null;
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
