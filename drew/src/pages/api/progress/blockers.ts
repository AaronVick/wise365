/**
 * File: /pages/api/progress/blockers.ts
 * 
 * Description: 
 * Identifies and analyzes current blockers in the marketing journey.
 * Uses LLMs to evaluate progress data, stalled milestones, and incomplete
 * prerequisites to determine what's blocking advancement.
 * 
 * Supporting Files:
 * - /services/funnel-progress.ts: Progress tracking
 * - /services/analysis/blocker-detection.ts: Blocker analysis
 * - Database Models: FunnelProgress, MilestoneProgress, FunnelPrerequisite
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

    // Fetch progress data with potential blockers
    const currentProgress = await prisma.funnelProgress.findMany({
      where: {
        userId: userId as string,
        teamId: teamId as string,
        OR: [
          { status: 'IN_PROGRESS' },
          { status: 'PAUSED' }
        ]
      },
      include: {
        funnel: {
          include: {
            prerequisites: true,
            milestones: true
          }
        },
        milestones: {
          include: {
            milestone: true
          }
        }
      }
    });

    // Route to LLM for blocker analysis
    const routingConfig = await notDiamondService.routeTask({
      taskType: 'blockerAnalysis',
      content: currentProgress
    });

    // Analyze blockers using selected LLM
    const blockerAnalysis = await routingConfig.llm.analyze({
      progress: currentProgress,
      prompt: "Identify and analyze progress blockers..."
    });

    // Group blockers by type and impact
    const blockers = blockerAnalysis.blockers.map(blocker => ({
      type: blocker.type,
      description: blocker.description,
      impact: blocker.impact,
      suggestions: blocker.suggestions,
      relatedFunnels: blocker.funnelIds,
      relatedMilestones: blocker.milestoneIds
    }));

    // Store blocker analysis
    await prisma.funnelAnalysisRecord.create({
      data: {
        progressId: currentProgress[0].id, // Store with primary funnel
        analysisType: 'BLOCKER_ANALYSIS',
        findings: blockerAnalysis.findings,
        recommendations: blockerAnalysis.recommendations,
        nextSteps: blockerAnalysis.resolutionSteps
      }
    });

    return res.status(200).json(formatApiResponse({
      blockers: {
        critical: blockers.filter(b => b.impact === 'HIGH'),
        moderate: blockers.filter(b => b.impact === 'MEDIUM'),
        minor: blockers.filter(b => b.impact === 'LOW')
      },
      analysis: blockerAnalysis.analysis,
      recommendations: blockerAnalysis.recommendations
    }));

  } catch (error) {
    console.error('Error analyzing blockers:', error);
    return handleApiError(res, error, 'Failed to analyze blockers');
  }
}