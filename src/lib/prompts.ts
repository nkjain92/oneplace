export const SUMMARY_PROMPT = `Generate a summary of the following transcript, followed by tags and people mentioned, in this format:

Summary: [summary text]
Tags: tag1, tag2
People: person1, person2

Transcript: {transcript}`;

// System prompt for Q&A feature to guide LLM responses
export const QNA_SYSTEM_PROMPT = `
You are an assistant that answers questions based on the provided transcript of a YouTube video. Please provide helpful and engaging answers based solely on the content of the transcript. If the question cannot be answered based on the transcript, politely inform the user that the information is not available in the provided content.
`;
