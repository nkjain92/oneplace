# GetSmart Database Schema Design

This document provides a comprehensive overview of the GetSmart application's database schema, including table definitions, relationships, indexes, functions, triggers, and Row Level Security (RLS) policies.

## Database Tables

### Profiles Table

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY, -- Same as auth.users.id
  name TEXT NOT NULL,
  avatar_url TEXT, -- Optional field for user avatar
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Summaries Table

```sql
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
```

### Channels Table

```sql
CREATE TABLE channels (
  id TEXT PRIMARY KEY, -- External channel/publisher ID
  name TEXT NOT NULL,
  description TEXT,
  rss_feed_url TEXT,
  tags TEXT[] -- Tags generated from channel metadata or recent content
);
```

### Subscriptions Table

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_id TEXT NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, channel_id)
);
```

### User Generated Summaries Table

```sql
CREATE TABLE user_generated_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  summary_id UUID NOT NULL REFERENCES summaries(id) ON DELETE CASCADE,
  generated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, summary_id)
);
```

### Chat History Table

```sql
CREATE TABLE chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content_id TEXT NOT NULL, -- References the content_id in summaries table
  question TEXT NOT NULL,
  answer TEXT,
  conversation_context JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  FOREIGN KEY (content_id) REFERENCES summaries(content_id) ON DELETE CASCADE
);
```

## Indexes

### Summaries Table Indexes

```sql
CREATE INDEX idx_summaries_content_id ON summaries(content_id);
CREATE INDEX idx_summaries_content_type ON summaries(content_type);
CREATE INDEX idx_summaries_publisher_id ON summaries(publisher_id);
```

### Channels Table Indexes

```sql
CREATE INDEX idx_channels_name ON channels(name);
```

### Subscriptions Table Indexes

```sql
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_channel_id ON subscriptions(channel_id);
```

### User Generated Summaries Table Indexes

```sql
CREATE INDEX idx_user_generated_summaries_user_id ON user_generated_summaries(user_id);
CREATE INDEX idx_user_generated_summaries_summary_id ON user_generated_summaries(summary_id);
```

### Chat History Table Indexes

```sql
CREATE INDEX idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX idx_chat_history_content_id ON chat_history(content_id);
```

## Functions and Triggers

### Update Modified Column Function

```sql
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$
LANGUAGE plpgsql;
```

### Triggers for Automatic Updated_at

```sql
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
```

### New User Registration Trigger

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
```

## Row Level Security (RLS)

### Enable RLS on All Tables

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_generated_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
```

### Current RLS Policies

#### Profiles Table Policies

```sql
-- Allow users to view only their own profile
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Allow insertion into profiles for new users
CREATE POLICY "Allow insertion into profiles for new users"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
```

#### Summaries Table Policies

```sql
-- Allow any user to view all summaries
CREATE POLICY "Summaries are viewable by everyone"
  ON summaries FOR SELECT
  USING (true);

-- Allow authenticated users to insert summaries
CREATE POLICY "Summaries can be inserted by authenticated users"
  ON summaries FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to update summaries
CREATE POLICY "Summaries can be updated by authenticated users"
  ON summaries FOR UPDATE
  USING (auth.uid() IS NOT NULL);
```

#### Channels Table Policies

```sql
-- Allow any user to view all channels
CREATE POLICY "Channels are viewable by everyone"
  ON channels FOR SELECT
  USING (true);

-- Allow authenticated users to insert channels
CREATE POLICY "Channels can be inserted by authenticated users"
  ON channels FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to update channels
CREATE POLICY "Channels can be updated by authenticated users"
  ON channels FOR UPDATE
  USING (auth.uid() IS NOT NULL);
```

#### Subscriptions Table Policies

```sql
-- Allow users to view only their own subscriptions
CREATE POLICY "Users can view their own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert their own subscriptions
CREATE POLICY "Users can insert their own subscriptions"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own subscriptions
CREATE POLICY "Users can delete their own subscriptions"
  ON subscriptions FOR DELETE
  USING (auth.uid() = user_id);
```

#### User Generated Summaries Table Policies

```sql
-- Allow users to view only their own generated summaries
CREATE POLICY "Users can view their own generated summaries"
  ON user_generated_summaries FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert their own generated summaries
CREATE POLICY "Users can insert their own generated summaries"
  ON user_generated_summaries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own generated summaries
CREATE POLICY "User generated summaries can be deleted by the user who created"
  ON user_generated_summaries FOR DELETE
  USING (auth.uid() = user_id);
```

#### Chat History Table Policies

```sql
-- Allow users to view only their own chat history
CREATE POLICY "Users can view their own chat history"
  ON chat_history FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert their own chat history
CREATE POLICY "Users can insert their own chat history"
  ON chat_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

## Entity-Relationship Diagram

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   profiles  │    │   channels  │    │  summaries  │
├─────────────┤    ├─────────────┤    ├─────────────┤
│ id (PK)     │    │ id (PK)     │    │ id (PK)     │
│ name        │    │ name        │    │ content_id  │
│ avatar_url  │    │ description │    │ content_type│
│ created_at  │    │ rss_feed_url│    │ source_url  │
│ updated_at  │    │ tags        │    │ title       │
└─────┬───────┘    └──────┬──────┘    │ publisher_id│
      │                   │           │ publisher_na│
      │                   │           │ content_crea│
      │                   │           │ transcript  │
      │      ┌────────────┤           │ summary     │
      │      │            │           │ detailed_sum│
┌─────┴──────┴────┐       │           │ tags        │
│  subscriptions  │       │           │ featured_nam│
├─────────────────┤       │           │ status      │
│ id (PK)         │       │           │ created_at  │
│ user_id (FK)    ├───────┘           │ updated_at  │
│ channel_id (FK) │                   └──────┬──────┘
│ created_at      │                          │
└─────────────────┘                          │
                                           │
┌────────────────────────┐        ┌────────┴───────────┐
│   chat_history         │        │ user_generated_sum │
├────────────────────────┤        ├────────────────────┤
│ id (PK)                │        │ id (PK)            │
│ user_id (FK)           │        │ user_id (FK)       │
│ content_id (FK)        ├────────┤ summary_id (FK)    │
│ question               │        │ generated_at       │
│ answer                 │        └────────────────────┘
│ conversation_context   │
│ created_at             │
└────────────────────────┘
```

## Recommended Modifications (ignore this section)

1. **Duplicate Policies** - The user_generated_summaries table has duplicate policies that should be consolidated.
2. **Profile Visibility** - Consider whether profiles should be visible to all users or only to their owners. The current policy restricts visibility to owners only.
3. **Index Names** - The chat_history table should use content_id for indexing instead of summary_id to match the foreign key relationship.

## Implementation Notes

1. The summary generation process starts with a "pending" status and is updated to "completed" once processed.
2. The profiles table is automatically populated when a new user signs up.
3. RLS policies ensure proper data access control based on user authentication.
4. The chat_history table is linked to summaries via content_id rather than id for better content tracking.
