-- Migration: Add thumbnail column to channels table
-- This adds a new column to store channel thumbnail URLs

-- Add the thumbnail column to channels table
ALTER TABLE channels
ADD COLUMN thumbnail TEXT;

-- Add comment to the column for documentation
COMMENT ON COLUMN channels.thumbnail IS 'URL to the channel thumbnail image stored in Supabase storage';

-- Update existing rows to use default placeholder if thumbnail is NULL
-- This will help maintain consistent UI for channels without thumbnails
-- UPDATE channels SET thumbnail = '/images/channel-placeholder.jpg' WHERE thumbnail IS NULL;