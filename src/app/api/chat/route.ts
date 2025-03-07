// src/app/api/chat/route.ts - Handles streaming Q&A responses for video transcripts
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { createSupabaseServiceClient } from '@/lib/supabaseServer';
import { QNA_SYSTEM_PROMPT } from '@/lib/prompts';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { videoId, messages } = await req.json();

  const supabase = await createSupabaseServiceClient();
  const { data, error } = await supabase
    .from('summaries')
    .select('transcript')
    .eq('content_id', videoId)
    .single();

  if (error || !data?.transcript) {
    return new Response('Transcript not found', { status: 404 });
  }
  const transcript = data.transcript;

  const systemMessage = {
    role: 'system',
    content: `${QNA_SYSTEM_PROMPT}\n\nTranscript:\n${transcript}`,
  };
  const fullMessages = [systemMessage, ...messages];

  const result = await streamText({
    model: openai('gpt-4o-mini'),
    messages: fullMessages,
  });

  return result.toDataStreamResponse();
}
