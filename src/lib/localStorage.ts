// src/lib/localStorage.ts - Utilities for managing content IDs in local storage for anonymous users

/**
 * Retrieves the list of generated content IDs from local storage for anonymous users
 * @returns Array of content IDs or empty array if none found or if localStorage is unavailable
 */
export function getAnonymousGeneratedContentIds(): string[] {
  try {
    const data = localStorage.getItem('user_summaries');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Adds a new content ID to the list in local storage for anonymous users if it doesn't already exist
 * @param contentId The content ID to add
 */
export function addAnonymousGeneratedContentId(contentId: string): void {
  try {
    const ids = getAnonymousGeneratedContentIds();
    if (!ids.includes(contentId)) {
      ids.push(contentId);
      localStorage.setItem('user_summaries', JSON.stringify(ids));
    }
  } catch {
    // Silently fail
  }
}
