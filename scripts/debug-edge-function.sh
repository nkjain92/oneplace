#!/bin/bash

# This script tests the check-new-videos edge function with proper authorization
# Usage: ./debug-edge-function.sh

# Load environment variables from .env file if it exists
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Check if required environment variables are set
if [ -z "$SUPABASE_FUNCTION_URL" ]; then
  echo "Error: SUPABASE_FUNCTION_URL is not set. Please set it in your .env file or export it."
  exit 1
fi

if [ -z "$CRON_SECRET" ]; then
  echo "Error: CRON_SECRET is not set. Please set it in your .env file or export it."
  exit 1
fi

# Make the HTTP request with verbose output to see headers
echo "Testing edge function at $SUPABASE_FUNCTION_URL with authorization..."
echo "Authorization header: Bearer $CRON_SECRET"

# First, make a request to httpbin to verify the headers are sent correctly
echo "Verifying headers with httpbin.org..."
curl -v -X POST \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  https://httpbin.org/post 2>&1 | grep -i authorization

echo ""
echo "Now testing with your actual function..."
# Then make the actual request to your function
curl -v -X POST \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  "$SUPABASE_FUNCTION_URL"

echo ""
echo "Test completed." 