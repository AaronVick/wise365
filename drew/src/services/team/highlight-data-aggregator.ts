// File: src/services/team/highlight-data-aggregator.ts
// Synopsis: Aggregates data from multiple sources, including funnels, conversations, and resources, for team highlights generation.
// Supporting Files: 
// - api/routes/funnel-progress.ts
// - api/routes/milestone-chat.ts
// - api/services/conversation-intelligence.ts
// - api/services/tool-progress.ts
// - api/services/dashboard-analytics.ts

import { getFunnelProgress } from '../funnel-progress';
import { getMilestoneChats } from '../milestone-chat';
import { analyzeConversations } from '../conversation-intelligence';
import { getToolProgress } from '../tool-progress';
import { getDashboardAnalytics } from '../dashboard-analytics';

export const aggregateHighlightData = async (teamId: string, userId?: string, timeRange?: string) => {
  try {
    // Collect funnel progress data
    const funnelProgress = await getFunnelProgress(teamId, userId);

    // Collect milestone chat data
    const milestoneChats = await getMilestoneChats(teamId, timeRange);

    // Analyze team conversations
    const conversationInsights = await analyzeConversations(teamId, timeRange);

    // Gather tool progress data
    const toolProgress = await getToolProgress(teamId, timeRange);

    // Fetch dashboard analytics
    const dashboardAnalytics = await getDashboardAnalytics(teamId, timeRange);

    // Combine all data into a unified structure
    return {
      funnelProgress,
      milestoneChats,
      conversationInsights,
      toolProgress,
      dashboardAnalytics,
    };
  } catch (error) {
    console.error('Error in aggregateHighlightData:', error);
    throw new Error('Failed to aggregate highlight data.');
  }
};
