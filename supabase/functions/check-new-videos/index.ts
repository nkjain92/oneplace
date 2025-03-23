// @ts-ignore: Deno-specific imports
// @deno-types="https://deno.land/std@0.168.0/http/server.ts"
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// @ts-ignore: Deno-specific imports
// @deno-types="https://esm.sh/@supabase/supabase-js@2"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// @ts-ignore: Deno-specific imports
// Simple XML parser
import { parse as parseXML } from 'https://deno.land/x/xml@2.1.1/mod.ts';

// Define interfaces for type safety
interface Video {
  id: string;
  title: any;
  url: any;
  published_at: string;
  status: string;
  error?: string;
  summary_id?: string;
  duration?: number;
  retry_count?: number;
}

// @ts-ignore: Deno-specific globals
// Configuration
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || '';
// @ts-ignore: Deno-specific globals
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
// @ts-ignore: Deno-specific globals
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
// @ts-ignore: Deno-specific globals
const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY') || '';
// @ts-ignore: Deno-specific globals
const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY') || '';
// @ts-ignore: Deno-specific globals
const CRON_SECRET = Deno.env.get('CRON_SECRET') || '';
// Constants
const MAX_CHANNELS_PER_RUN = 3; // Reduce from 5 to 3 channels per run
const FETCH_TIMEOUT_MS = 8000; // Reduce from 10s to 8s timeout for fetch operations
const PROCESS_TIMEOUT_MS = 55000; // Increase from 50s to 55s timeout for the entire process
const DAYS_TO_CHECK = 1; // Check for videos from the last 1 day
const MAX_VIDEOS_PER_CHANNEL = 3; // Limit videos processed per channel
const MAX_SUMMARY_RETRIES = 3; // Maximum number of retries for summary generation
const RETRY_DELAY_MS = 1000; // Base delay for retry in milliseconds (will be multiplied by 2^retry_count)
// Summary prompt template - simplified for efficiency
const SUMMARY_PROMPT = `You are an expert content summarizer who creates structured, concise summaries. Analyze the following transcript and create a summary that matches the original's tone and style.

OUTPUT FORMAT (STRICTLY FOLLOW THIS):
Summary:
* **[Main Point]**: [Clear explanation]
* **[Main Point]**: [Clear explanation]
* **[Main Point]**: [Clear explanation]
* **[Main Point]**: [Clear explanation]
* **[Main Point]**: [Clear explanation]

[OPTIONAL - Include ONLY if there is a HIGHLY impactful, specific quote that meaningfully represents a key insight. Do NOT include generic statements or routine explanations:]
> "Direct quote from the content"

Tags: tag1, tag2, tag3, tag4, tag5

People: person1, person2, person3

REQUIREMENTS:
1. NEVER use phrases like "this video," "the speaker," "in this transcript," etc. Avoid referencing the medium (e.g., 'this video,' 'the speaker').
2. Match the EXACT tone and language style of the original content.
3. Each bullet point MUST follow the format: * **Bold main point**: Explanation
4. Include exactly 5-8 bullet points covering the most important insights.
5. Keep total summary length between 150-250 words.
6. Include 5-10 relevant lowercase tags separated by commas.
7. List all people mentioned, separated by commas. If no specific people are mentioned, write "None" in the People section.
8. QUOTES: Only include quotes that are genuinely impactful, specific, and central to the content's message. If no strong quotes exist, OMIT the quote section entirely. Never fabricate quotes or include generic statements.

GOOD EXAMPLE:
-----
Summary:
* **AI Risk Management Framework**: The framework provides a comprehensive approach for organizations to address AI risks while promoting innovation.
* **Four Core Functions**: The framework is built around four functions: govern, map, measure, and manage.
* **Customizable Implementation**: Organizations can adapt the framework based on their context, use cases, and risk profiles.
* **Transparency Requirements**: Companies must document AI systems and communicate clearly about their capabilities and limitations.
* **Continuous Testing**: Regular evaluation of AI systems helps identify and mitigate potential risks and biases.

Tags: ai ethics, risk management, governance, compliance, technology policy, data security

People: Mark Johnson, Sarah Williams, David Chen
-----

BAD EXAMPLE:
-----
Summary:
In this video, the speaker discusses AI risk management. The transcript shows several points about governance and implementation. They talk about four functions and mention transparency.

> "We need to be careful with AI" [BAD - this is too generic and not impactful]

Tags: AI, management, video
People: Johnson, someone else
-----

Now analyze and summarize the following transcript:

Transcript: {transcript}`;
// Function to extract YouTube video ID from URL
function extractYouTubeVideoId(url: string) {
  if (!url) return null;
  console.log(`Extracting video ID from URL: ${url}`);
  // Handle standard watch URLs
  const watchRegex = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|v\/)|youtu\.be\/)([\w-]+)/i;
  const watchMatch = url.match(watchRegex);
  if (watchMatch) {
    console.log(`Extracted video ID from watch URL: ${watchMatch[1]}`);
    return watchMatch[1];
  }
  // Handle embed URLs
  const embedRegex = /youtube\.com\/embed\/([\w-]+)/i;
  const embedMatch = url.match(embedRegex);
  if (embedMatch) {
    console.log(`Extracted video ID from embed URL: ${embedMatch[1]}`);
    return embedMatch[1];
  }
  // Handle shorts URLs
  const shortsRegex = /youtube\.com\/shorts\/([\w-]+)/i;
  const shortsMatch = url.match(shortsRegex);
  if (shortsMatch) {
    console.log(`Extracted video ID from shorts URL: ${shortsMatch[1]}`);
    return shortsMatch[1];
  }
  // Handle direct video IDs (for YouTube RSS feeds)
  if (url.match(/^[A-Za-z0-9_-]{11}$/)) {
    console.log(`URL appears to be a direct video ID: ${url}`);
    return url;
  }
  // Try to extract from YouTube RSS feed ID format
  const idRegex = /video:([A-Za-z0-9_-]{11})$/;
  const idMatch = url.match(idRegex);
  if (idMatch) {
    console.log(`Extracted video ID from RSS feed ID: ${idMatch[1]}`);
    return idMatch[1];
  }
  console.log(`Could not extract video ID from URL: ${url}`);
  return null;
}
// Fetch with timeout
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = FETCH_TIMEOUT_MS,
) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}
// Function to fetch YouTube transcript
async function fetchYouTubeTranscript(videoId: string) {
  if (!RAPIDAPI_KEY) {
    console.error('RAPIDAPI_KEY environment variable is not set or empty');
    throw new Error('RAPIDAPI_KEY environment variable is not set or empty');
  }
  try {
    console.log(`Fetching transcript for video ${videoId} using RapidAPI`);
    const response = await fetchWithTimeout(
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
// Function to generate summary using OpenAI with retry mechanism
async function generateSummary(transcript: string, retryCount = 0): Promise<{ summary: string; tags: string[]; people: string[] }> {
  if (!OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY environment variable is not set or empty');
    throw new Error('OPENAI_API_KEY environment variable is not set or empty');
  }
  
  try {
    const prompt = SUMMARY_PROMPT.replace('{transcript}', transcript);
    console.log(`Calling AI model to generate summary (attempt ${retryCount + 1}/${MAX_SUMMARY_RETRIES + 1})...`);
    
    const response = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a professional content summarizer that produces precise, structured summaries in a consistent format. Always match the tone of the original content. Never refer to "this transcript" or "this video". Focus only on the content itself. Follow instructions exactly.'
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
        response_format: { type: "text" },
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error(`OpenAI API error: ${response.status} - ${errorData}`);
      throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
    }
    
    const data = await response.json();
    const fullSummary = data.choices[0]?.message?.content || '';
    
    if (!fullSummary || fullSummary.length < 10) {
      throw new Error('Generated summary is too short or empty');
    }
    
    console.log(`Successfully generated summary (${fullSummary.length} characters)`);
    
    // Parse the response to extract summary, tags, and people using improved parsing
    let summary = '';
    let tags: string[] = [];
    let people: string[] = [];
    let inSummarySection = false;
    let inTagsSection = false;
    let inPeopleSection = false;
    const lines = fullSummary.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Detect section headers
      if (line.startsWith('Summary:')) {
        inSummarySection = true;
        inTagsSection = false;
        inPeopleSection = false;
        continue; // Skip the header line itself
      } else if (line.startsWith('Tags:')) {
        inSummarySection = false;
        inTagsSection = true;
        inPeopleSection = false;
        
        // Extract tags from the same line if present
        const tagsString = line.substring('Tags:'.length).trim();
        if (tagsString.length > 0) {
          tags = tagsString
            .split(',')
            .map((tag: string) => tag.trim())
            .filter((tag: string) => tag.length > 0);
        }
        continue;
      } else if (line.startsWith('People:')) {
        inSummarySection = false;
        inTagsSection = false;
        inPeopleSection = true;
        
        // Extract people from the same line if present
        const peopleString = line.substring('People:'.length).trim();
        if (peopleString.length > 0) {
          people = peopleString
            .split(',')
            .map((person: string) => person.trim())
            .filter((person: string) => person.length > 0);
        }
        continue;
      }
      
      // Process content based on current section
      if (inSummarySection && line.length > 0) {
        if (summary.length > 0) {
          summary += '\n' + line;
        } else {
          summary = line;
        }
      } else if (inTagsSection && line.length > 0 && tags.length === 0) {
        // Only process if we haven't extracted tags from the header line
        tags = line
          .split(',')
          .map((tag: string) => tag.trim())
          .filter((tag: string) => tag.length > 0);
      } else if (inPeopleSection && line.length > 0 && people.length === 0) {
        // Only process if we haven't extracted people from the header line
        people = line
          .split(',')
          .map((person: string) => person.trim())
          .filter((person: string) => person.length > 0);
      }
    }
    
    // Clean up the summary - remove any meta-references
    summary = summary
      .replace(/in this transcript/gi, '')
      .replace(/in this video/gi, '')
      .replace(/the speaker says/gi, '')
      .replace(/the speaker mentions/gi, '')
      .replace(/the video discusses/gi, '')
      .replace(/the transcript shows/gi, '')
      .replace(/according to the transcript/gi, '')
      .replace(/according to the video/gi, '')
      .trim();
    
    // Validate the parsed results
    if (!summary || summary.length < 10) {
      throw new Error('Parsed summary is too short or empty');
    }
    
    // Ensure tags and people are arrays even if empty
    tags = Array.isArray(tags) ? tags : [];
    
    // Handle the case where "None" is specified for people
    if (people.length === 1 && people[0].toLowerCase() === "none") {
      people = [];
    } else {
      people = Array.isArray(people) ? people : [];
    }
    
    console.log('Extracted Summary:', summary.substring(0, 150) + '...');
    console.log('Extracted Tags:', tags);
    console.log('Extracted People:', people);
    
    return {
      summary,
      tags,
      people,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error generating summary (attempt ${retryCount + 1}/${MAX_SUMMARY_RETRIES + 1}): ${errorMessage}`);
    
    // Check if we should retry
    if (retryCount < MAX_SUMMARY_RETRIES) {
      // Calculate exponential backoff delay
      const delay = RETRY_DELAY_MS * Math.pow(2, retryCount);
      console.log(`Retrying summary generation in ${delay}ms (attempt ${retryCount + 1}/${MAX_SUMMARY_RETRIES})...`);
      
      // Wait for the delay
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Retry with incremented retry count
      return generateSummary(transcript, retryCount + 1);
    }
    
    // If we've exhausted all retries, throw the error
    throw new Error(`Failed to generate summary after ${MAX_SUMMARY_RETRIES + 1} attempts: ${errorMessage}`);
  }
}
// Helper function to safely extract text content from XML node
function getTextContent(obj: any, nodeName: string) {
  if (!obj) return '';
  // If the node exists directly
  if (obj[nodeName] && typeof obj[nodeName] === 'string') {
    return obj[nodeName];
  }
  // If the node is an object with a text property
  if (obj[nodeName] && obj[nodeName]['#text']) {
    return obj[nodeName]['#text'];
  }
  return '';
}
// Helper function to safely get attribute from XML node
function getAttribute(obj: any, nodeName: string, attrName: string) {
  if (!obj || !obj[nodeName]) return '';
  // If the node has attributes
  if (obj[nodeName]['@attributes'] && obj[nodeName]['@attributes'][attrName]) {
    return obj[nodeName]['@attributes'][attrName];
  }
  return '';
}
// Helper function to safely extract video link from entry
function extractVideoLink(entry: any) {
  if (!entry) return '';
  // Debug the entry structure
  console.log(`Entry structure: ${JSON.stringify(entry, null, 2).substring(0, 500)}...`);
  // Handle YouTube RSS feed format
  if (entry.link) {
    // Case 1: Simple string link
    if (typeof entry.link === 'string') {
      console.log(`Found string link: ${entry.link}`);
      return entry.link;
    } else if (Array.isArray(entry.link)) {
      console.log(`Found array of links with ${entry.link.length} items`);
      // Find the first link with rel="alternate" or just take the first one
      const alternateLink = entry.link.find(
        l => l['@attributes'] && l['@attributes'].rel === 'alternate',
      );
      if (alternateLink && alternateLink['@attributes']) {
        console.log(`Found alternate link: ${alternateLink['@attributes'].href}`);
        return alternateLink['@attributes'].href || '';
      } else if (entry.link[0] && entry.link[0]['@attributes']) {
        console.log(`Using first link: ${entry.link[0]['@attributes'].href}`);
        return entry.link[0]['@attributes'].href || '';
      } else if (entry.link[0] && typeof entry.link[0] === 'string') {
        console.log(`Using first string link: ${entry.link[0]}`);
        return entry.link[0];
      }
    } else if (entry.link['@attributes'] && entry.link['@attributes'].href) {
      console.log(`Found link with attributes: ${entry.link['@attributes'].href}`);
      return entry.link['@attributes'].href;
    } else if ('href' in entry.link) {
      console.log(`Found link with href: ${entry.link.href}`);
      return entry.link.href || '';
    }
  }
  // Try to find a direct YouTube video ID
  if (entry.videoId || entry['yt:videoId']) {
    const videoId = entry.videoId || entry['yt:videoId'];
    console.log(`Found direct videoId: ${videoId}`);
    return `https://www.youtube.com/watch?v=${videoId}`;
  }
  // Try to find an ID in the entry structure
  if (entry.id && typeof entry.id === 'string' && entry.id.includes('video:')) {
    const parts = entry.id.split(':');
    const videoId = parts[parts.length - 1];
    console.log(`Extracted videoId from id field: ${videoId}`);
    return `https://www.youtube.com/watch?v=${videoId}`;
  }
  console.log(`Could not extract video link from entry`);
  return '';
}
// Function to calculate total video duration from transcript segments in seconds
function calculateVideoDuration(transcriptData: any): number {
  // Handle the case where transcriptData might be a string
  let parsedData;
  
  if (typeof transcriptData === 'string') {
    try {
      parsedData = JSON.parse(transcriptData);
    } catch (error) {
      console.error('Error parsing transcript data string:', error);
      return 0;
    }
  } else {
    parsedData = transcriptData;
  }
  
  // Handle the transcript_raw format with "success" and "transcript" array
  if (parsedData && parsedData.success && Array.isArray(parsedData.transcript)) {
    // If the transcript is empty, return 0
    if (parsedData.transcript.length === 0) {
      return 0;
    }
    
    try {
      // Get the last segment
      const lastSegment = parsedData.transcript[parsedData.transcript.length - 1];
      
      // Check for offset and duration properties (as in the sample format)
      if (lastSegment.offset !== undefined && lastSegment.duration !== undefined) {
        const offsetValue = parseFloat(lastSegment.offset);
        const durationValue = parseFloat(lastSegment.duration);
        return Math.round(offsetValue + durationValue);
      }
      
      // Handle original format with start and duration properties
      if (lastSegment.start !== undefined && lastSegment.duration !== undefined) {
        return Math.round(lastSegment.start + lastSegment.duration);
      }
      
      // Alternative calculation: sum up all durations
      let totalDuration = 0;
      for (const segment of parsedData.transcript) {
        if (segment.duration !== undefined) {
          totalDuration += parseFloat(typeof segment.duration === 'string' ? segment.duration : segment.duration);
        }
      }
      
      return Math.round(totalDuration);
    } catch (error) {
      console.error('Error calculating video duration:', error);
      return 0;
    }
  }
  
  // Handle legacy format 
  if (parsedData?.transcript && Array.isArray(parsedData.transcript)) {
    // Original implementation
    if (parsedData.transcript.length === 0) {
      return 0;
    }
    
    try {
      const lastSegment = parsedData.transcript[parsedData.transcript.length - 1];
      
      if (lastSegment.start !== undefined && lastSegment.duration !== undefined) {
        return Math.round(lastSegment.start + lastSegment.duration);
      }
      
      let totalDuration = 0;
      for (const segment of parsedData.transcript) {
        if (segment.duration !== undefined) {
          totalDuration += segment.duration;
        }
      }
      
      return Math.round(totalDuration);
    } catch (error) {
      console.error('Error calculating video duration from legacy format:', error);
      return 0;
    }
  }
  
  return 0;
}
// Main function to handle the request
async function handleRequest(req: Request) {
  // Set a timeout to ensure the function doesn't run too long
  const timeoutId = setTimeout(() => {
    console.error('Function timed out after', PROCESS_TIMEOUT_MS, 'ms');
    throw new Error(`Function timed out after ${PROCESS_TIMEOUT_MS}ms`);
  }, PROCESS_TIMEOUT_MS);
  // Record the start time for performance tracking
  const startTime = new Date();
  // Check if API keys are set
  console.log(`RAPIDAPI_KEY set: ${!!RAPIDAPI_KEY}`);
  console.log(`OPENAI_API_KEY set: ${!!OPENAI_API_KEY}`);
  try {
    console.log(`Starting check-new-videos function - Method: ${req.method}`);
    // Create Supabase client with service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    console.log('Supabase client created');
    // Check authorization for non-GET requests
    if (req.method !== 'GET') {
      // Verify the request is from Supabase cron
      const authHeader = req.headers.get('Authorization');
      if (!authHeader || authHeader !== `Bearer ${CRON_SECRET}`) {
        console.log('Unauthorized request');
        clearTimeout(timeoutId);
        return new Response(
          JSON.stringify({
            error: 'Unauthorized',
          }),
          {
            status: 401,
            headers: {
              'Content-Type': 'application/json',
            },
          },
        );
      }
    }
    
    // Get channels that have at least one subscriber
    console.log('Fetching channels with at least one subscriber');
    const { data: subscribedChannelIds, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('channel_id')
      .order('channel_id');
    
    if (subscriptionError) {
      clearTimeout(timeoutId);
      throw new Error(`Error fetching subscribed channels: ${subscriptionError.message}`);
    }
    
    if (!subscribedChannelIds || subscribedChannelIds.length === 0) {
      console.log('No subscribed channels found');
      clearTimeout(timeoutId);
      return new Response(
        JSON.stringify({
          message: 'No subscribed channels found',
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
    }
    
    // Extract unique channel IDs from subscriptions
    const uniqueChannelIds = [...new Set(subscribedChannelIds.map(sub => sub.channel_id))];
    console.log(`Found ${uniqueChannelIds.length} unique subscribed channels`);
    
    // Get channels from the database that have subscribers, ordered by last_checked
    const { data: allChannels, error: channelsError } = await supabase
      .from('channels')
      .select('id, name, rss_feed_url, last_checked')
      .in('id', uniqueChannelIds)
      .order('last_checked', {
        ascending: true,
        nullsFirst: true,
      });
    
    if (channelsError) {
      clearTimeout(timeoutId);
      throw new Error(`Error fetching channels: ${channelsError.message}`);
    }
    
    if (!allChannels || allChannels.length === 0) {
      console.log('No subscribed channels found in channels table');
      clearTimeout(timeoutId);
      return new Response(
        JSON.stringify({
          message: 'No subscribed channels found in channels table',
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
    }

    // Limit the number of channels to process
    const channelsToProcess = allChannels.slice(0, MAX_CHANNELS_PER_RUN);
    console.log(
      `Processing ${channelsToProcess.length} of ${allChannels.length} subscribed channels, prioritized by last checked date`,
    );
    // Log the channels being processed with their last checked date
    channelsToProcess.forEach((channel: any) => {
      console.log(`Channel: ${channel.name}, Last checked: ${channel.last_checked || 'Never'}`);
    });
    // Calculate the timestamp for the specified number of days ago
    const now = new Date();
    const cutoffDate = new Date(now);
    cutoffDate.setDate(cutoffDate.getDate() - DAYS_TO_CHECK);
    console.log(
      `Checking for videos newer than ${cutoffDate.toISOString()} (${DAYS_TO_CHECK} days ago)`,
    );
    // Add a function to normalize dates that might be in the future
    function normalizeDate(dateStr: string) {
      const date = new Date(dateStr);
      // For YouTube feeds with future dates (2025), we'll treat them as valid
      // This is because YouTube sometimes uses future dates in their RSS feeds
      // We'll consider all videos as recent regardless of their date
      console.log(`Processing date: ${dateStr} -> ${date.toISOString()}`);
      return date;
    }
    // Track results
    const results = {
      processed: 0,
      newVideos: 0,
      errors: 0,
      videos_added: 0,
      summaries_generated: 0,
      channels: [],
    };
    // Process each channel
    for (const channel of channelsToProcess) {
      console.log(`Processing channel: ${channel.name} (${channel.id})`);
      try {
        results.processed++;
        if (!channel.rss_feed_url) {
          console.log(`Skipping channel ${channel.name}: No RSS feed URL`);
          results.channels.push({
            id: channel.id,
            name: channel.name,
            status: 'skipped',
            reason: 'No RSS feed URL',
            videos_checked: 0,
            recent_videos: 0,
            videos: [],
            last_checked: channel.last_checked,
          });
          continue;
        }
        // Fetch the RSS feed
        console.log(`Fetching RSS feed for channel ${channel.name}: ${channel.rss_feed_url}`);
        const response = await fetchWithTimeout(channel.rss_feed_url);
        const xmlText = await response.text();
        console.log(`RSS feed fetched (${xmlText.length} characters)`);
        // Parse the XML
        console.log('Parsing XML');
        const parsedXml = parseXML(xmlText);
        console.log('XML parsed');
        // Extract entries from the feed
        let entries = parsedXml?.feed?.entry || [];
        // Ensure entries is always an array (handle case when there's only one entry)
        if (entries && !Array.isArray(entries)) {
          console.log('Single entry detected, converting to array');
          entries = [entries];
        }
        if (!entries || entries.length === 0) {
          console.log(`No entries found in RSS feed for channel ${channel.name}`);
          results.channels.push({
            id: channel.id,
            name: channel.name,
            status: 'no_videos',
            reason: 'No entries found in RSS feed',
            videos_checked: 0,
            recent_videos: 0,
            videos: [],
            last_checked: channel.last_checked,
          });
          continue;
        }
        console.log(`Found ${entries.length} entries in RSS feed`);
        // Limit the number of entries to process
        const entriesToProcess = entries.slice(0, MAX_VIDEOS_PER_CHANNEL);
        console.log(
          `Processing ${entriesToProcess.length} entries (limited to ${MAX_VIDEOS_PER_CHANNEL} per channel)`,
        );
        // Create a channel result object
        const channelResult = {
          id: channel.id,
          name: channel.name,
          status: 'processed',
          videos_checked: entries.length,
          recent_videos: 0,
          videos: [],
          last_checked: channel.last_checked,
        };
        // Process each recent video
        let recentVideosCount = 0;
        let processedVideos = 0;
        for (const entry of entriesToProcess) {
          try {
            const pubDateStr = entry.pubDate || entry.published || '';
            const pubDate = normalizeDate(pubDateStr);
            // Always consider videos as recent for YouTube feeds with future dates
            // This is a workaround for YouTube's RSS feed using 2025 dates
            recentVideosCount++;
            // Extract video ID from the link
            const videoLink = extractVideoLink(entry);
            const videoTitle = getTextContent(entry, 'title') || 'Untitled Video';
            const currentVideoId = extractYouTubeVideoId(videoLink);
            console.log(
              `Processing recent video: ${videoTitle} (${currentVideoId}), published ${pubDate.toISOString()} (original date: ${pubDateStr})`,
            );
            if (!currentVideoId) {
              console.log(`Skipping: Could not extract video ID from ${videoLink}`);
              continue;
            }
            // Create a video entry
            const videoEntry: Video = {
              id: currentVideoId,
              title: videoTitle,
              url: videoLink,
              published_at: pubDate.toISOString(),
              status: 'checked',
            };
            // Add the video to the channel result
            channelResult.videos.push(videoEntry);
            console.log(`Added video to channel result: ${videoTitle} (${currentVideoId})`);
            // Check if summary already exists for this video
            const { data: existingSummary, error: summaryCheckError } = await supabase
              .from('summaries')
              .select(
                'id, title, summary, tags, featured_names, publisher_name, content_created_at, duration_in_seconds, transcript_raw',
              )
              .eq('content_id', currentVideoId)
              .maybeSingle();
            if (summaryCheckError) {
              console.error(`Error checking for existing summary: ${summaryCheckError.message}`);
              videoEntry.status = 'error';
              videoEntry.error = `Error checking for existing summary: ${summaryCheckError.message}`;
              results.errors++;
              continue;
            }
            if (existingSummary) {
              console.log(`Video ${currentVideoId} already has summary ID: ${existingSummary.id}`);
              
              // Check if duration_in_seconds is missing but we have transcript_raw
              if ((!existingSummary.duration_in_seconds || existingSummary.duration_in_seconds === 0) && 
                  existingSummary.transcript_raw) {
                try {
                  // Calculate duration from existing transcript_raw
                  const calculatedDuration = calculateVideoDuration(existingSummary.transcript_raw);
                  console.log(`Calculated duration for existing summary: ${calculatedDuration} seconds`);
                  
                  if (calculatedDuration > 0) {
                    // Update the summary with the calculated duration (as integer)
                    const { error: updateDurationError } = await supabase
                      .from('summaries')
                      .update({ duration_in_seconds: Math.round(calculatedDuration) })
                      .eq('id', existingSummary.id);
                      
                    if (updateDurationError) {
                      console.error(`Error updating duration: ${updateDurationError.message}`);
                    } else {
                      console.log(`Updated duration for summary ${existingSummary.id} to ${Math.round(calculatedDuration)} seconds`);
                    }
                  }
                } catch (durationError) {
                  console.error(`Error calculating duration for existing summary: ${durationError}`);
                }
              }
              
              videoEntry.status = 'already_summarized';
              videoEntry.summary_id = existingSummary.id;
              continue;
            }
            // No existing summary found, generate a new one
            console.log(
              `No existing summary found for video ${currentVideoId}. Generating new summary.`,
            );
            videoEntry.status = 'processing_summary';
            try {
              // Fetch transcript from YouTube
              console.log(`Fetching transcript for ${currentVideoId}`);
              const transcriptResult = await fetchYouTubeTranscript(currentVideoId);
              const transcript = transcriptResult.text;
              const transcriptRaw = transcriptResult.raw;
              console.log(`Transcript fetched (${transcript.length} characters)`);
              
              // Calculate video duration in seconds
              const videoDurationSeconds = Math.round(calculateVideoDuration(transcriptRaw));
              console.log(`Video duration: ${videoDurationSeconds} seconds`);
              
              // Skip videos shorter than 180 seconds (3 minutes)
              if (videoDurationSeconds < 180) {
                console.log(`Skipping video ${currentVideoId}: Duration (${videoDurationSeconds}s) is less than 3 minutes`);
                videoEntry.status = 'skipped_short_video';
                videoEntry.duration = videoDurationSeconds;
                continue;
              }
              
              if (transcript.length > 0) {
                // First try to generate a summary before creating a database entry
                console.log(`Attempting to generate summary for video ${currentVideoId}`);
                try {
                  // Generate a summary using OpenAI with retry mechanism
                  const { summary, tags, people } = await generateSummary(transcript);
                  console.log('Summary generated successfully');
                  
                  // Now that we have a successful summary, insert a record into the summaries table
                  console.log('Inserting summary record into database');
                  const { data: insertedData, error: summaryInsertError } = await supabase
                    .from('summaries')
                    .insert([
                      {
                        content_id: currentVideoId,
                        content_type: 'video',
                        source_url: videoLink,
                        title: videoTitle,
                        publisher_id: channel.id,
                        publisher_name: channel.name,
                        content_created_at: pubDate.toISOString(),
                        transcript: transcript,
                        transcript_raw: transcriptRaw,
                        duration_in_seconds: Math.round(videoDurationSeconds),
                        summary: summary,
                        tags: tags,
                        featured_names: people,
                        status: 'completed',
                      },
                    ])
                    .select('id');
                    
                  if (summaryInsertError) {
                    console.error(`Error storing summary: ${summaryInsertError.message}`);
                    videoEntry.status = 'error';
                    videoEntry.error = `Error storing summary: ${summaryInsertError.message}`;
                    continue;
                  }
                  
                  if (!insertedData || insertedData.length === 0) {
                    console.error('Failed to get ID of inserted summary');
                    videoEntry.status = 'error';
                    videoEntry.error = 'Failed to get ID of inserted summary';
                    continue;
                  }
                  
                  const summaryId = insertedData[0].id;
                  console.log(`Summary record created with ID: ${summaryId}`);
                  videoEntry.summary_id = summaryId;
                  videoEntry.status = 'summarized';
                  results.summaries_generated++;
                  
                } catch (summaryError) {
                  const errorMessage =
                    summaryError instanceof Error ? summaryError.message : String(summaryError);
                  console.error(`Error generating summary after all retries: ${errorMessage}`);
                  
                  // Don't create a database entry, just log the error
                  videoEntry.status = 'summary_failed';
                  videoEntry.error = `Error generating summary after all retries: ${errorMessage}`;
                }
              } else {
                console.log(`No transcript available for video ${currentVideoId}`);
                videoEntry.status = 'no_transcript';
              }
            } catch (summaryError) {
              const errorMessage =
                summaryError instanceof Error ? summaryError.message : String(summaryError);
              console.error(`Error processing summary: ${errorMessage}`);
              videoEntry.status = 'error';
              videoEntry.error = `Error processing summary: ${errorMessage}`;
            }
          } catch (entryError) {
            const errorMessage =
              entryError instanceof Error ? entryError.message : String(entryError);
            console.error(`Error processing entry: ${errorMessage}`);
            // If we have a video ID, add it to the results
            const currentVideoId = extractYouTubeVideoId(extractVideoLink(entry));
            if (currentVideoId) {
              const errorVideoEntry: Video = {
                id: currentVideoId,
                title: getTextContent(entry, 'title') || 'Unknown',
                url: extractVideoLink(entry),
                published_at: new Date().toISOString(),
                status: 'error',
                error: errorMessage,
              };
              channelResult.videos.push(errorVideoEntry);
            }
            results.errors++;
          }
          // Check if we've processed enough videos for this channel
          if (processedVideos >= MAX_VIDEOS_PER_CHANNEL) {
            console.log(
              `Reached limit of ${MAX_VIDEOS_PER_CHANNEL} videos for channel ${channel.name}`,
            );
            break;
          }
          processedVideos++;
        }
        // Update the channel result with the count of recent videos
        channelResult.recent_videos = recentVideosCount;
        console.log(`Found ${recentVideosCount} recent videos for channel ${channel.name}`);
        // Add channel result to results
        results.channels.push(channelResult);
        // Update the last_checked timestamp for this channel
        const now = new Date().toISOString();
        const { error: updateError } = await supabase
          .from('channels')
          .update({
            last_checked: now,
          })
          .eq('id', channel.id);
        if (updateError) {
          console.error(
            `Error updating last_checked for channel ${channel.name}: ${updateError.message}`,
          );
        } else {
          console.log(`Updated last_checked to ${now} for channel ${channel.name}`);
        }
      } catch (channelError) {
        const errorMessage =
          channelError instanceof Error ? channelError.message : String(channelError);
        console.error(`Error processing channel ${channel.name}: ${errorMessage}`);
        results.channels.push({
          id: channel.id,
          name: channel.name,
          status: 'error',
          error: errorMessage,
          videos_checked: 0,
          recent_videos: 0,
          videos: [],
          last_checked: channel.last_checked,
        });
        results.errors++;
      }
    }
    console.log('Function completed successfully');
    clearTimeout(timeoutId);
    // Return the results
    const endTime = new Date();
    const executionTime = endTime.getTime() - startTime.getTime();
    console.log(`Execution time: ${executionTime}ms`);
    // Log the final results for debugging
    console.log(`Total channels processed: ${results.channels.length}`);
    for (const channel of results.channels) {
      console.log(
        `Channel ${channel.name}: ${channel.recent_videos} recent videos, ${channel.videos.length} videos in array`,
      );
    }
    // Create a deep copy of the results to ensure all data is included
    const responseData = {
      message: 'Cron job completed',
      timestamp: endTime.toISOString(),
      executionTime: `${executionTime}ms`,
      timeWindow: `${DAYS_TO_CHECK} days`,
      cutoffDate: cutoffDate.toISOString(),
      totalChannels: allChannels.length,
      processedChannels: channelsToProcess.length,
      summary: {
        processed: results.processed,
        newVideos: results.videos_added,
        summaries: results.summaries_generated,
        errors: results.errors,
      },
      channels: JSON.parse(JSON.stringify(results.channels)),
    };
    console.log(`Response data: ${JSON.stringify(responseData, null, 2)}`);
    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error(`Global error: ${error instanceof Error ? error.message : String(error)}`);
    clearTimeout(timeoutId);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  }
}
// Main handler function
serve(handleRequest);
