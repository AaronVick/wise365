// File: src/services/team/highlight-service.ts
// Synopsis: Main service that orchestrates data aggregation, analysis, and highlight generation.
// Supporting Files:
// - highlight-data-aggregator.ts
// - highlight-generator.ts

import { aggregateHighlightData } from './highlight-data-aggregator';
import { generateHighlights } from './highlight-generator';

export const getTeamHighlights = async (teamId: string, userId?: string, timeRange?: string) => {
  try {
    // Step 1: Aggregate data
    const aggregatedData = await aggregateHighlightData(teamId, userId, timeRange);

    // Step 2: Generate highlights from aggregated data
    const highlights = await generateHighlights(aggregatedData);

    // Return final highlights
    return highlights;
  } catch (error) {
    console.error('Error in getTeamHighlights:', error);
    throw new Error('Failed to retrieve team highlights.');
  }
};
