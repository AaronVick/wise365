// File: src/services/team/highlight-generator.ts
// Synopsis: Generates highlights from aggregated data using an LLM for analysis and summarization.
// Supporting Files:
// - src/services/routing/routing-analyzer.service.ts
// - src/lib/llm/llm-handler.ts

import { routeTask } from '../routing/routing-analyzer.service';
import { handleLLMInteraction } from '../llm/llm-handler';

export const generateHighlights = async (aggregatedData: any) => {
  try {
    // Route the task to the preferred LLM
    const llmRouting = await routeTask('team_highlights');

    // Define the prompt for LLM
    const prompt = `
      Analyze the following team data and generate relevant highlights:
      ${JSON.stringify(aggregatedData)}
    `;

    // Send prompt to LLM
    const llmResponse = await handleLLMInteraction({
      prompt,
      context: { taskType: 'team_highlights', routing: llmRouting },
    });

    // Return the highlights
    return llmResponse.data.highlights;
  } catch (error) {
    console.error('Error in generateHighlights:', error);
    throw new Error('Failed to generate highlights.');
  }
};
