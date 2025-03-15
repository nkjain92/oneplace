// src/lib/youtubeTranscript.ts - Fetches YouTube video transcripts using RapidAPI

// Define the structure of a transcript segment from the API
interface TranscriptSegment {
  text: string;
  duration: number;
  offset: string;
  lang: string;
}

// Function to fetch YouTube transcript
export default async function fetchYouTubeTranscript(videoId: string) {
  const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
  
  if (!RAPIDAPI_KEY) {
    console.error('RAPIDAPI_KEY environment variable is not set or empty');
    throw new Error('RAPIDAPI_KEY environment variable is not set or empty');
  }
  
  try {
    console.log(`Fetching transcript for video ${videoId} using RapidAPI`);
    const response = await fetch(
      `https://youtube-transcript3.p.rapidapi.com/api/transcript?videoId=${videoId}`,
      {
        headers: {
          'x-rapidapi-key': RAPIDAPI_KEY,
          'x-rapidapi-host': 'youtube-transcript3.p.rapidapi.com',
        },
      },
    );
    
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(
        `Failed to fetch transcript: ${response.status} ${response.statusText} - ${errorBody}`,
      );
      throw new Error(
        `Failed to fetch transcript: ${response.status} ${response.statusText} - ${errorBody}`,
      );
    }
    
    const data = await response.json();
    
    if (!data.transcript || !Array.isArray(data.transcript)) {
      console.error('Invalid transcript format received from API');
      throw new Error('Invalid transcript format received from API');
    }
    
    // Store the raw transcript data
    const rawTranscript = data;
    
    // Combine all transcript segments into a single string
    const transcriptText = data.transcript
      .map((segment: { text: string }) => segment.text)
      .join(' ');
      
    console.log(
      `Successfully fetched transcript for ${videoId} (${transcriptText.length} characters)`,
    );
    
    return {
      text: transcriptText,
      raw: rawTranscript
    };
  } catch (error) {
    console.error(
      `Error fetching YouTube transcript: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    throw new Error(
      `Error fetching YouTube transcript: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}
