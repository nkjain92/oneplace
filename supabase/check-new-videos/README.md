# YouTube Channel Video Checker Cron Job

This Supabase Edge Function runs as a scheduled cron job to check for new videos from YouTube channels stored in the database and generate summaries for them.

## How It Works

1. The function runs daily at midnight (configurable in `config.json`)
2. It fetches all channels from the `channels` table in the database
3. For each channel, it fetches the RSS feed from the `rss_feed_url` column
4. It checks for videos published or updated in the last 24 hours
5. For each new video, it:
   - Fetches the transcript using the RapidAPI YouTube Transcript API
   - Generates a summary using OpenAI
   - Stores the summary in the `summaries` table

## Required Environment Variables

The following environment variables must be set in the Supabase project:

- `OPENAI_API_KEY`: Your OpenAI API key
- `YOUTUBE_API_KEY`: Your YouTube Data API key
- `RAPIDAPI_KEY`: Your RapidAPI key for the YouTube Transcript API
- `CRON_SECRET`: A secret key to authenticate cron job requests

## Deployment

To deploy this function to your Supabase project:

1. Make sure you have the Supabase CLI installed:

   ```
   npm install -g supabase
   ```

2. Link your local project to your Supabase project:

   ```
   supabase link --project-ref your-project-ref
   ```

3. Deploy the function:

   ```
   supabase functions deploy check-new-videos --no-verify-jwt
   ```

4. Set the required environment variables:
   ```
   supabase secrets set OPENAI_API_KEY=your-openai-api-key
   supabase secrets set YOUTUBE_API_KEY=your-youtube-api-key
   supabase secrets set RAPIDAPI_KEY=your-rapidapi-key
   supabase secrets set CRON_SECRET=your-cron-secret
   ```

## Testing

You can test the function by making a GET request to the function URL with the appropriate authorization header:

```
curl -X GET https://your-project-ref.supabase.co/functions/v1/check-new-videos \
  -H "Authorization: Bearer your-cron-secret"
```

## Logs

You can view the logs for the function in the Supabase dashboard under "Edge Functions" > "check-new-videos" > "Logs".

## Customization

- To change the schedule, modify the `schedule` field in `config.json`. The format is a cron expression.
- To modify the summary prompt, update the `SUMMARY_PROMPT` constant in `index.ts`.
