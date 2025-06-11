// src/app/api/chat/route.ts - Handles streaming Q&A responses for video transcripts
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { createSupabaseServiceClient, createSupabaseServerClient } from '@/lib/supabaseServer';
import { QNA_SYSTEM_PROMPT } from '@/lib/prompts';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// Helper function to extract just the text from a response
function extractTextContent(response: unknown): string {
  // If the response is a string, assume it's the text content
  if (typeof response === 'string') {
    return response;
  }

  // If it's an object, try to extract the text field
  if (typeof response === 'object' && response !== null) {
    const responseObj = response as Record<string, unknown>;
    if (typeof responseObj.text === 'string') {
      return responseObj.text;
    }
    // If there's no text field, check if it's a JSON string in a string field
    if (typeof responseObj.content === 'string') {
      return responseObj.content;
    }
  }

  // If we can't determine the text, return a default message
  return 'Response unavailable';
}

export async function POST(req: Request) {
  const { videoId, messages } = await req.json();

  // Use service client to fetch transcript (bypasses RLS)
  const supabaseService = await createSupabaseServiceClient();
  const { data, error } = await supabaseService
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

  // Get the latest user question from messages
  const latestUserMessage = messages.filter((msg: { role: string }) => msg.role === 'user').pop();
  const latestQuestion = latestUserMessage?.content || '';

  // Get the authenticated user (if any)
  const supabaseServer = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  // Determine the user ID - for anonymous users, use null
  // This is compatible with the UUID type in the database which is nullable
  const userId = user?.id || null;

  // Create a record ID for this chat interaction
  let recordId: string | null = null;

  // First, insert a record with just the question (answer will be updated after streaming)
  try {
    // For both authenticated and anonymous users, we'll create a record
    // For anonymous users, userId will be null which is allowed by the schema
    const { data, error } = await supabaseService
      .from('chat_history')
      .insert({
        user_id: userId,
        content_id: videoId,
        question: latestQuestion,
        answer: 'Generating response...',
        conversation_context: messages,
      })
      .select('id');

    if (error) {
      console.error('Failed to create chat history record:', error);
    } else if (data && data.length > 0) {
      recordId = data[0].id;
      console.log('Chat history record created with ID:', recordId);
    }
  } catch (error) {
    console.error('Error creating chat history record:', error);
  }

  // Stream the response to the client with improved error handling and performance
  try {
    const result = await streamText({
      model: openai('gpt-4.1'),
      messages: fullMessages,
      temperature: 0.7, // Add some creativity but keep responses focused
      maxTokens: 3000, // Limit response length for faster streaming
      onFinish: async completeAnswer => {
        // After streaming is complete, update the record with the full answer
        if (recordId) {
          try {
            // Extract just the text content from the response
            const answerText = extractTextContent(completeAnswer);

            console.log(
              'Saving answer text:',
              typeof answerText === 'string'
                ? answerText.substring(0, 100) + '...'
                : 'Not a string',
            );

            const { error } = await supabaseService
              .from('chat_history')
              .update({ answer: answerText })
              .eq('id', recordId);

            if (error) {
              console.error('Failed to update chat history with answer:', error);
            } else {
              console.log('Chat history answer updated successfully');
            }
          } catch (error) {
            console.error('Error updating chat history answer:', error);
          }
        }
      },
    });

    // Use the correct method to convert the stream to a response
    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Error streaming response:', error);
    return new Response('Error generating response', { status: 500 });
  }
}
