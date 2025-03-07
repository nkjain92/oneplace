// src/lib/localStorage.ts - Utilities for managing content IDs in local storage for anonymous users

/**
 * Retrieves the list of generated content IDs from local storage
 * @returns Array of content IDs or empty array if none found or if localStorage is unavailable
 */
export function getGeneratedContentIds(): string[] {
  try {
    const data = localStorage.getItem('generatedContentIds');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Adds a new content ID to the list in local storage if it doesn't already exist
 * @param contentId The content ID to add
 */
export function addGeneratedContentId(contentId: string): void {
  try {
    const ids = getGeneratedContentIds();
    if (!ids.includes(contentId)) {
      ids.push(contentId);
      localStorage.setItem('generatedContentIds', JSON.stringify(ids));
    }
  } catch {
    // Silently fail
  }
}
