# DB Schema Design

-- Create profiles table
CREATE TABLE profiles (
id UUID PRIMARY KEY, -- Same as auth.users.id
name TEXT NOT NULL,
avatar_url TEXT, -- Optional field for user avatar
created_at TIMESTAMPTZ DEFAULT now(),
updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create summaries table
CREATE TABLE summaries (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
content_id TEXT NOT NULL, -- Unique external identifier from the content provider
content_type TEXT NOT NULL DEFAULT 'video', -- e.g., 'video', 'podcast', 'article', 'blog'
source_url TEXT, -- The URL to the original content
title TEXT NOT NULL, -- Title of the content
publisher_id TEXT, -- External publisher or channel ID
publisher_name TEXT, -- Name of the publisher/channel
content_created_at TIMESTAMPTZ, -- When the content was originally published
transcript TEXT, -- Full transcript (if available)
summary TEXT, -- Short summary for quick display
detailed_summary TEXT, -- Detailed summary for extended view
tags TEXT[], -- Array of tags generated for the content
featured_names TEXT[], -- Array of names featured in the content
status TEXT DEFAULT 'pending', -- e.g., 'pending', 'completed', 'error'
created_at TIMESTAMPTZ DEFAULT now(),
updated_at TIMESTAMPTZ DEFAULT now(),
UNIQUE (content_id)
);

-- Indexes for summaries table
CREATE INDEX idx_summaries_content_id ON summaries(content_id);
CREATE INDEX idx_summaries_content_type ON summaries(content_type);
CREATE INDEX idx_summaries_publisher_id ON summaries(publisher_id);

-- Create channels table
CREATE TABLE channels (
id TEXT PRIMARY KEY, -- External channel/publisher ID
name TEXT NOT NULL,
description TEXT,
rss_feed_url TEXT,
tags TEXT[] -- Tags generated from channel metadata or recent content
);

-- Index for channels table
CREATE INDEX idx_channels_name ON channels(name);

-- Create subscriptions table
CREATE TABLE subscriptions (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
channel_id TEXT NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
created_at TIMESTAMPTZ DEFAULT now(),
UNIQUE (user_id, channel_id)
);

-- Indexes for subscriptions table
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_channel_id ON subscriptions(channel_id);

-- Create user_generated_summaries table
CREATE TABLE user_generated_summaries (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
summary_id UUID NOT NULL REFERENCES summaries(id) ON DELETE CASCADE,
generated_at TIMESTAMPTZ DEFAULT now(),
UNIQUE (user_id, summary_id)
);

-- Indexes for user_generated_summaries table
CREATE INDEX idx_user_generated_summaries_user_id ON user_generated_summaries(user_id);
CREATE INDEX idx_user_generated_summaries_summary_id ON user_generated_summaries(summary_id);

-- Create chat_history table
CREATE TABLE chat_history (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
content_id TEXT NOT NULL, -- Changed from summary_id to content_id
question TEXT NOT NULL,
answer TEXT,
conversation_context JSONB,
created_at TIMESTAMPTZ DEFAULT now(),
FOREIGN KEY (content_id) REFERENCES summaries(content_id) ON DELETE CASCADE
);

-- Indexes for chat_history table
CREATE INDEX idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX idx_chat_history_summary_id ON chat_history(summary_id);

-- Function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;

$$
LANGUAGE plpgsql;

-- Trigger for profiles table
CREATE TRIGGER update_profiles_modtime
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Trigger for summaries table
CREATE TRIGGER update_summaries_modtime
    BEFORE UPDATE ON summaries
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Set up Row Level Security (RLS) policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_generated_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all profiles but only update their own
CREATE POLICY "Profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Summaries: Everyone can read summaries
CREATE POLICY "Summaries are viewable by everyone"
    ON summaries FOR SELECT
    USING (true);

-- Channels: Everyone can read channels
CREATE POLICY "Channels are viewable by everyone"
    ON channels FOR SELECT
    USING (true);

-- Subscriptions: Users can read all subscriptions but only manage their own
CREATE POLICY "Subscriptions are viewable by everyone"
    ON subscriptions FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own subscriptions"
    ON subscriptions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subscriptions"
    ON subscriptions FOR DELETE
    USING (auth.uid() = user_id);

-- User Generated Summaries: Users can read all but only manage their own
CREATE POLICY "User generated summaries are viewable by everyone"
    ON user_generated_summaries FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own generated summaries"
    ON user_generated_summaries FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Chat History: Users can read and manage only their own chat history
CREATE POLICY "Users can view their own chat history"
    ON chat_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat history"
    ON chat_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create a trigger to create a profile entry when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS
$$

BEGIN
INSERT INTO public.profiles (id, name, avatar_url)
VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), NULL);
RETURN NEW;
END;

$$
LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
$$
