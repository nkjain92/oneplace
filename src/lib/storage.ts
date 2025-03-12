// src/lib/storage.ts - Utility functions for Supabase storage operations

import { createSupabaseServiceClient } from './supabaseServer';

// Constants for storage configuration
const STORAGE_BUCKET = 'channel-thumbnails';
const SUPABASE_STORAGE_ENDPOINT = 'https://ijtwvrzkbnfepbfyfrvc.supabase.co/storage/v1/s3';
const SUPABASE_REGION = 'ap-south-1';

/**
 * Initialize storage bucket if it doesn't exist
 */
export async function initializeStorage() {
  try {
    const supabase = await createSupabaseServiceClient();

    // Check if bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === STORAGE_BUCKET);

    // Create bucket if it doesn't exist
    if (!bucketExists) {
      const { error } = await supabase.storage.createBucket(STORAGE_BUCKET, {
        public: true, // Make files publicly accessible
        fileSizeLimit: 5242880, // 5MB limit
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      });

      if (error) {
        console.error('Error creating storage bucket:', error.message);
        throw error;
      }

      console.log(`Created storage bucket: ${STORAGE_BUCKET}`);
    }

    return true;
  } catch (error) {
    console.error('Storage initialization error:', error);
    return false;
  }
}

/**
 * Download a file from a URL and upload it to Supabase storage
 * @param url URL of the file to download
 * @param filename Filename to use in storage
 * @returns Public URL of the uploaded file or null if failed
 */
export async function downloadAndUploadFile(url: string, filename: string): Promise<string | null> {
  try {
    // Initialize storage
    await initializeStorage();

    // Download the file
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
    }

    // Convert to blob
    const blob = await response.blob();

    // Upload to Supabase
    const supabase = await createSupabaseServiceClient();
    const { data, error } = await supabase.storage.from(STORAGE_BUCKET).upload(filename, blob, {
      cacheControl: '3600',
      upsert: true, // Overwrite if exists
    });

    if (error) {
      console.error('Error uploading file to storage:', error.message);
      throw error;
    }

    // Get public URL
    const { data: publicUrl } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filename);

    return publicUrl.publicUrl;
  } catch (error) {
    console.error('Error in downloadAndUploadFile:', error);
    return null;
  }
}

/**
 * Get the public URL for a file in storage
 * @param filename Name of the file in storage
 * @returns Public URL of the file
 */
export function getPublicUrl(filename: string): string {
  return `${SUPABASE_STORAGE_ENDPOINT}/${STORAGE_BUCKET}/${filename}`;
}
