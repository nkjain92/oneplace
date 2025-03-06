// src/lib/youtubeTranscript.ts - Fetches YouTube video transcripts using RapidAPI

// Define the structure of a transcript segment from the API
interface TranscriptSegment {
  text: string;
  duration: number;
  offset: string;
  lang: string;
}

export default async function fetchYouTubeTranscript(videoId: string): Promise<string> {
  if (!process.env.RAPIDAPI_KEY) {
    throw new Error('RAPIDAPI_KEY environment variable is not set');
  }

  try {
    const response = await fetch(
      `https://youtube-transcript3.p.rapidapi.com/api/transcript?videoId=${videoId}`,
      {
        headers: {
          'x-rapidapi-key': process.env.RAPIDAPI_KEY,
          'x-rapidapi-host': 'youtube-transcript3.p.rapidapi.com',
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch transcript: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Check if the response has a transcript array
    if (!data.transcript || !Array.isArray(data.transcript)) {
      throw new Error('Invalid transcript format received from API');
    }

    // Combine all transcript segments into a single string
    const transcriptText = data.transcript
      .map((segment: TranscriptSegment) => segment.text)
      .join(' ');

    return transcriptText;
  } catch (error) {
    throw new Error(
      `Error fetching YouTube transcript: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}
