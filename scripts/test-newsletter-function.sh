#!/bin/bash

# This script tests the send-daily-newsletter edge function with proper authorization
# Usage: ./test-newsletter-function.sh

# Load environment variables from .env file if it exists
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Check if required environment variables are set
if [ -z "$SUPABASE_FUNCTION_URL_NEWSLETTER" ]; then
  echo "Error: SUPABASE_FUNCTION_URL_NEWSLETTER is not set."
  echo "Please set it in your .env file or export it as:"
  echo "export SUPABASE_FUNCTION_URL_NEWSLETTER=https://[project-ref].supabase.co/functions/v1/send-daily-newsletter"
  exit 1
fi

if [ -z "$CRON_SECRET" ]; then
  echo "Error: CRON_SECRET is not set. Please set it in your .env file or export it."
  exit 1
fi

# Make the HTTP request with verbose output to see headers
echo "Testing newsletter edge function at $SUPABASE_FUNCTION_URL_NEWSLETTER with authorization..."
echo "Authorization header: Bearer $CRON_SECRET"

# Make the actual request to your function
curl -v -X POST \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  "$SUPABASE_FUNCTION_URL_NEWSLETTER"

echo ""
echo "Test completed." 