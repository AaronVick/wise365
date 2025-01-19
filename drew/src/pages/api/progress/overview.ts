/**
 * File: /pages/api/progress/overview.ts
 * 
 * Description: 
 * Provides a comprehensive overview of marketing journey progress across all funnels,
 * milestones, and assessments. Aggregates data from multiple sources to show overall
 * progress and achievements.
 * 
 * Supporting Files:
 * - /services/funnel-progress.ts: Funnel progress tracking
 * - /services/msw/analysis.ts: MSW assessment analysis
 * - /services/team/highlight-generator.ts: Progress highlights
 * - Database Models: FunnelProgress, MilestoneProgress, FunnelAssessment
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { formatApiResponse, handleApiError } from '../../../lib/api-utils';
import { NotDiamondService } from '../../../services/routing/implementations/not-diamond.service';

const notDiamondService = new NotDiamondService();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return handleApiError(res, new Error('Method not allowed'), 'Only GET method is allowed');
  }

  try {
    const { userId, teamId } = req.query;

    // Fetch all funnel progress
    const funnelProgress = await prisma.funnelProgress.findMany({
      where: {
        userId: userId as string,
        teamId: teamId as string,
      },
      include: {
        funnel: true,
        milestones: true,
        assessments: {
          orderBy: { conductedAt: 'desc' },
          take: 1, // Latest assessment
        }
      }
    });

    // Fetch recent activity
    const recentActivity = await prisma.milestoneProgress.findMany({
      where: {
        progress: {
          userId: userId as string,
          teamId: teamId as string,
        }
      },
      orderBy: { completedAt: 'desc' },
      take: 5,
      include: {
        milestone: true
      }
    });

    // Route to LLM for progress analysis
    const routingConfig = await notDiamondService.routeTask({
      taskType: 'progressAnalysis',
      content: {
        funnelProgress,
        recentActivity
      }
    });

    // Generate insights using selected LLM
    const analysis = await routingConfig.llm.analyze({
      progress: funnelProgress,
      activity: recentActivity,
      prompt: "Analyze overall marketing journey progress..."
    });

    return res.status(200).json(formatApiResponse({
      progress: {
        overall: analysis.overallProgress,
        byFunnel: funnelProgress.map(fp => ({
          funnelId: fp.funnelId,
          status: fp.status,
          completion: fp.completionPercentage,
          insights: analysis.funnelInsights[fp.funnelId]
        }))
      },
      recentActivity: recentActivity.map(activity => ({
        type: 'milestone',
        milestoneId: activity.milestoneId,
        status: activity.status,
        completedAt: activity.completedAt
      })),
      insights: analysis.insights,
      recommendations: analysis.recommendations
    }));

  } catch (error) {
    console.error('Error fetching progress overview:', error);
    return handleApiError(res, error, 'Failed to fetch progress overview');
  }
}