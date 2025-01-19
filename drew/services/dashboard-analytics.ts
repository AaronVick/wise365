// services/dashboard-analytics.ts

/**
 * Service for analyzing and preparing dashboard-level analytics
 * 
 * Works with:
 * - models/FunnelProgress
 * - models/ConversationAnalysis
 * - services/user-progress.ts
 * 
 * Provides analytics and insights for dashboard display
 */

import { prisma } from '@/lib/prisma';

export async function getDashboardAnalytics(userId: string, teamId?: string) {
  const [funnelProgress, toolUsage, recentActivity] = await Promise.all([
    // Get funnel progress summary
    prisma.funnelProgress.groupBy({
      by: ['status'],
      where: {
        OR: [
          { userId },
          { teamId: teamId || '' }
        ]
      },
      _count: true
    }),

    // Get tool usage metrics
    prisma.resourcesData.groupBy({
      by: ['resourceId'],
      where: {
        OR: [
          { userId },
          { teamId: teamId || '' }
        ]
      },
      _count: true
    }),

    // Get recent activity
    prisma.userConversation.findMany({
      where: {
        OR: [
          { userId },
          { teamId: teamId || '' }
        ]
      },
      include: {
        messages: {
          orderBy: { timestamp: 'desc' },
          take: 1
        }
      },
      orderBy: { lastMessage: 'desc' },
      take: 5
    })
  ]);

  return {
    funnelMetrics: funnelProgress,
    toolMetrics: toolUsage,
    recentActivity: recentActivity
  };
}