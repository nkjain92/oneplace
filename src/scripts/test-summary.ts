// src/scripts/test-summary.ts - Script to test the summary generation process
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { SUMMARY_PROMPT } from '../lib/prompts';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Sample transcript (just a placeholder for testing)
const sampleTranscript = `
In this video, we discuss how Ritesh Agarwal saved OYO from near collapse.
Founded in 2013, OYO grew rapidly but faced significant challenges by 2019.
Ritesh implemented a strategic turnaround focusing on profitability and sustainable growth.
The company cut staff, improved technology, and focused on quality control.
`;

async function testSummaryGeneration() {
  try {
    console.log('Testing summary generation...');

    // Replace transcript placeholder in the prompt
    const prompt = SUMMARY_PROMPT.replace('{transcript}', sampleTranscript);

    console.log('Prompt:', prompt);

    // Call the AI model to generate the summary
    const result = await generateText({
      model: openai('gpt-4o-mini'),
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    // Get the full text response
    const fullSummary = result.text || '';
    console.log('\nGenerated summary:\n', fullSummary);

    // Parse the response to extract summary, tags, and people
    let summary = '';
    let tags: string[] = [];
    let people: string[] = [];
    let inSummarySection = false;

    const lines = fullSummary.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.startsWith('Summary:')) {
        inSummarySection = true;
        // Get the initial part after "Summary:"
        summary = line.substring('Summary:'.length).trim();
        continue;
      } else if (line.startsWith('Tags:')) {
        inSummarySection = false;
        const tagsString = line.substring('Tags:'.length).trim();
        tags = tagsString
          .split(',')
          .map((tag: string) => tag.trim())
          .filter((tag: string) => tag.length > 0);
      } else if (line.startsWith('People:')) {
        inSummarySection = false;
        const peopleString = line.substring('People:'.length).trim();
        people = peopleString
          .split(',')
          .map((person: string) => person.trim())
          .filter((person: string) => person.length > 0);
      } else if (inSummarySection) {
        // Preserve line breaks in markdown by adding proper newlines
        // Only add a new line if the summary already has content
        if (summary.length > 0) {
          // If line is empty, it's a paragraph break in markdown
          if (line === '') {
            summary += '\n\n';
          } else {
            summary += '\n' + line;
          }
        } else {
          summary = line;
        }
      }
    }

    console.log('\nParsed Summary:\n', summary);
    console.log('\nParsed Tags:', tags);
    console.log('\nParsed People:', people);
  } catch (error) {
    console.error('Error testing summary generation:', error);
  }
}

// Run the test
testSummaryGeneration();
