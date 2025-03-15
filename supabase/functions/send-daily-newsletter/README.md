# Daily Newsletter Email Sender

This Supabase Edge Function runs as a scheduled cron job to send daily newsletter emails to users about new summaries from their subscribed channels.

## How It Works

1. The function runs daily at 9am IST (3:30am UTC) as configured in `config.json`
2. It fetches all users from the `auth.users` table
3. For each user, it:
   - Fetches their subscribed channels from the `subscriptions` table
   - Checks for new summaries from those channels created in the last 24 hours
   - If there are new summaries, it sends an email newsletter to the user using Resend
   - The email includes links to the summaries and information about the content

## Required Environment Variables

The following environment variables must be set in the Supabase project:

- `RESEND_API_KEY`: Your Resend API key for sending emails
- `NEXT_PUBLIC_APP_DOMAIN`: The domain of your application (for generating links)
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
   supabase functions deploy send-daily-newsletter --no-verify-jwt
   ```

4. Set the required environment variables:
   ```
   supabase secrets set RESEND_API_KEY=your-resend-api-key
   supabase secrets set NEXT_PUBLIC_APP_DOMAIN=your-app-domain
   supabase secrets set CRON_SECRET=your-cron-secret
   ```

## Testing

You can test the function by making a POST request to the function URL with the appropriate authorization header:

```
curl -X POST https://your-project-ref.supabase.co/functions/v1/send-daily-newsletter \
  -H "Authorization: Bearer your-cron-secret"
```

## Logs

You can view the logs for the function in the Supabase dashboard under "Edge Functions" > "send-daily-newsletter" > "Logs". 