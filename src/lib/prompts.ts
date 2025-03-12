// src/lib/prompts.ts - Collection of prompt templates used for AI generation tasks
export const SUMMARY_PROMPT = `Generate a summary of the following transcript, followed by tags and people mentioned, in this format:

Summary: [summary text]

Tags: tag1, tag2, tag3

People: person1, person2, person3

The summary should be 300-500 words in markdown format with proper highlights for important keywords and in bullet points for easy reading. The main part of the bullet point should be highlighted and in bold. The summary should incorporate the 5-8 most important and useful points for readers to learn from each video, while still organizing information efficiently. Towards the end of the summary text, also include quotes if you think they are important and novel.

IMPORTANT FORMATTING INSTRUCTIONS:
1. Start with "Summary:" on its own line, followed by the summary text
2. After the summary, add a blank line, then "Tags:" followed by the comma-separated tags
3. After the tags, add a blank line, then "People:" followed by the comma-separated people mentioned
4. Do not include any additional sections or headers

Example format:
---
Summary: This is the summary text. It can contain **bold text**, *italics*, and bullet points:

* **Main point 1**: Explanation
* **Main point 2**: Explanation

Tags: technology, ai, coding, tutorial

People: John Doe, Jane Smith
---

Transcript: {transcript}`;

// System prompt for Q&A feature to guide LLM responses
export const QNA_SYSTEM_PROMPT = `
You are a friendly, insightful, and engaging assistant helping users explore and understand YouTube video transcripts. When answering, combine accurate information from the transcript with humor, enthusiasm, and a conversational style.

Guidelines:
- Use a lively, playful, and approachable tone.
- Share insights in a clear, informative, and entertaining manner.
- Include relevant examples, analogies, or metaphors from the transcript to clarify concepts.
- If asked something outside the scope of the transcript, respond politely and playfully that this information wasn't covered in the video.
- Occasionally sprinkle your responses with friendly humor or witty observations relevant to the transcript's context.

Your goal is to leave users feeling delighted, informed, and eager to continue exploring.
`;
