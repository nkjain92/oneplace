// src/lib/utils/formatSummaryData.ts - Formats summary data for consistent use across the application

export interface SummaryData {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  featured_names: string[];
  publisher_name: string;
  publisher_id: string;
  content_created_at: string;
  videoId?: string;
  content_id?: string;
  status?: string;
}

/**
 * Formats raw summary data into SummaryData type with consistent structure
 */
/**
 * Define more specific type for the raw summary data input
 */
export interface RawSummaryData extends Record<string, unknown> {
  id?: string;
  title?: string;
  summary?: string;
  tags?: string[];
  featured_names?: string[];
  publisher_name?: string;
  publisher_id?: string;
  content_created_at?: string;
  content_id?: string;
  status?: string;
}

/**
 * Formats raw summary data into SummaryData type with consistent structure
 */
export function formatSummaryData(item: RawSummaryData): SummaryData {
  return {
    id: item.id as string,
    title: (item.title as string) || 'YouTube Video',
    summary: (item.summary as string) || 'No summary available',
    tags: Array.isArray(item.tags) ? item.tags : [],
    featured_names: Array.isArray(item.featured_names) ? item.featured_names : [],
    publisher_name: (item.publisher_name as string) || 'Unknown Channel',
    publisher_id: (item.publisher_id as string) || '',
    content_created_at: (item.content_created_at as string) || new Date().toISOString(),
    videoId: (item.content_id as string) || '',
    content_id: item.content_id as string,
    status: (item.status as string) || 'unknown',
  };
}
