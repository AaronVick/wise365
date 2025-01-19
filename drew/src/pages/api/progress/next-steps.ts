/**
 * File: /pages/api/progress/next-steps.ts
 * 
 * Description: 
 * Analyzes current progress and provides intelligent recommendations for
 * next actions. Uses LLMs to evaluate progress data and suggest optimal
 * next steps for marketing journey advancement.
 * 
 * Supporting Files:
 * - /services/funnel-progress.ts: Progress tracking
 * - /services/agents/matcher.service.ts: Agent recommendations
 * - Database Models: FunnelProgress, MilestoneProgress, FunnelSuggestedAction
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

    // Fetch active funnels and their progress
    const funnelProgress = await prisma.funnelProgress.findMany({
      where: {
        userId: userId as string,
        teamId: teamId as string,
        status: {
          in: ['NOT_STARTED', 'IN_PROGRESS']
        }
      },
      include: {
        funnel: {
          include: {
            milestones: true,
            prerequisites: true
          }
        },
        milestones: true
      }
    });

    // Route to LLM for next steps analysis
    const routingConfig = await notDiamondService.routeTask({
      taskType: 'nextStepsAnalysis',
      content: funnelProgress
    });

    // Generate recommendations using selected LLM
    const recommendations = await routingConfig.llm.analyze({
      progress: funnelProgress,
      prompt: "Based on current progress, recommend next steps..."
    });

    // Store suggested actions
    await prisma.funnelSuggestedAction.createMany({
      data: recommendations.actions.map(action => ({
        progressId: action.funnelProgressId,
        type: action.type,
        priority: action.priority,
        description: action.description,
        reasoning: action.reasoning,
        status: 'PENDING',
        suggestedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }))
    });

    return res.status(200).json(formatApiResponse({
      immediateActions: recommendations.immediate,
      shortTermGoals: recommendations.shortTerm,
      strategicRecommendations: recommendations.strategic,
      reasoning: recommendations.reasoning,
      priorityOrder: recommendations.priorityOrder
    }));

  } catch (error) {
    console.error('Error generating next steps:', error);
    return handleApiError(res, error, 'Failed to generate next steps');
  }
}