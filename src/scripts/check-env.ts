// src/scripts/check-env.ts - Script to check if required environment variables are set
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Check for required environment variables
console.log('Checking environment variables...');

const requiredEnvVars = [
  'YOUTUBE_API_KEY',
  'OPENAI_API_KEY',
  'RAPIDAPI_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
];

let missingVars = 0;

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ ${envVar} is not set`);
    missingVars++;
  } else {
    console.log(`✅ ${envVar} is set`);
  }
}

if (missingVars > 0) {
  console.error(`\n${missingVars} environment variable(s) are missing.`);
  console.log('Please set them in your .env file.');
} else {
  console.log('\nAll required environment variables are set.');
}
