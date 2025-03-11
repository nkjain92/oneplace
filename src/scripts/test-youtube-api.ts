// src/scripts/test-youtube-api.ts - Script to test the YouTube API and transcript fetching
import dotenv from 'dotenv';
import fetchYouTubeTranscript from '../lib/youtubeTranscript';
import fetchYouTubeChannelDetails from '../lib/youtubeChannel';

// Load environment variables
dotenv.config();

async function testYouTubeAPI() {
  try {
    const videoId = '-6jjhk-ZRQo';

    console.log('Testing YouTube API with video ID:', videoId);

    // Test channel details
    console.log('\n1. Testing channel details fetching...');
    try {
      const channelDetails = await fetchYouTubeChannelDetails(videoId);
      console.log('Channel details:', JSON.stringify(channelDetails, null, 2));
    } catch (error) {
      console.error('Error fetching channel details:', error);
    }

    // Test video details using YouTube API directly
    console.log('\n2. Testing video details fetching from YouTube API...');
    try {
      const videoResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${process.env.YOUTUBE_API_KEY}`,
      );

      if (!videoResponse.ok) {
        throw new Error(
          `Error fetching video details: ${videoResponse.status} ${videoResponse.statusText}`,
        );
      }

      const videoData = await videoResponse.json();
      console.log('Video details:', JSON.stringify(videoData, null, 2));
    } catch (error) {
      console.error('Error fetching video details:', error);
    }

    // Test transcript fetching
    console.log('\n3. Testing transcript fetching...');
    try {
      const transcript = await fetchYouTubeTranscript(videoId);
      console.log('Transcript length:', transcript.length);
      console.log('First 200 characters of transcript:', transcript.substring(0, 200) + '...');
    } catch (error) {
      console.error('Error fetching transcript:', error);
    }
  } catch (error) {
    console.error('Error in test:', error);
  }
}

// Run the test
testYouTubeAPI();
