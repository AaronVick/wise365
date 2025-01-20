// api/suggestions/actions.ts

/**
 * Provides intelligent next action suggestions based on user's funnel progress,
 * data completeness, and system prerequisites.
 * 
 * This API analyzes the user's current state across all funnels and determines
 * the most important next steps they should take, prioritizing:
 * 1. Onboarding completion if incomplete
 * 2. Missing required data for current funnel
 * 3. Next milestone requirements
 * 4. Prerequisite funnel requirements
 * 
 * @description Returns prioritized list of suggested actions for the user
 * 
 * This route works with:
 * - services/funnel-progress.ts: Gets current funnel progress
 * - services/user-progress.ts: Gets overall user progress
 * - models/FunnelDefinition: Funnel requirements and structure
 * - models/FunnelPrerequisite: Prerequisites between funnels
 * - models/DataPointCollection: User's collected data
 */

import { PrismaClient } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';

// Maximum number of suggestions to return
const MAX_SUGGESTIONS = 3;

interface SuggestedAction {
  id: string;
  type: 'start_funnel' | 'complete_data' | 'milestone_action' | 'assessment';
  title: string;
  description: string;
  priority: number;
  action: {
    type: string;
    target: string;
    metadata?: Record<string, any>;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const prisma = new PrismaClient();
  const { userId, teamId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    // Get user's current funnel progress
    const funnelProgress = await prisma.funnelProgress.findMany({
      where: {
        userId: userId as string,
        teamId: teamId as string || undefined,
      },
      include: {
        funnel: {
          include: {
            milestones: true,
            dataPoints: true,
            prerequisites: true
          }
        },
        milestones: true,
        dataPoints: true
      }
    });

    // Get all funnel definitions to check what user hasn't started
    const allFunnels = await prisma.funnelDefinition.findMany({
      where: { isActive: true },
      include: {
        prerequisites: true,
        dataPoints: {
          where: { isRequired: true }
        }
      },
      orderBy: [
        { priority: 'asc' },
        { level: 'asc' }
      ]
    });

    const suggestions: SuggestedAction[] = [];

    // Check if user needs onboarding
    const onboardingFunnel = allFunnels.find(f => f.name === "Onboarding Funnel");
    const hasStartedOnboarding = funnelProgress.some(p => 
      p.funnel.name === "Onboarding Funnel"
    );

    if (onboardingFunnel && !hasStartedOnboarding) {
      suggestions.push({
        id: `onboarding-${Date.now()}`,
        type: 'start_funnel',
        title: 'Complete Your Onboarding',
        description: 'Start with providing basic information about your business',
        priority: 1,
        action: {
          type: 'navigate',
          target: `/funnels/${onboardingFunnel.id}/start`
        }
      });
    }

    // For each active funnel progress, check for incomplete requirements
    for (const progress of funnelProgress) {
      // Check for missing required data points
      const missingDataPoints = progress.funnel.dataPoints.filter(dp =>
        dp.isRequired && !progress.dataPoints.some(collected => 
          collected.dataPointId === dp.id
        )
      );

      if (missingDataPoints.length > 0) {
        suggestions.push({
          id: `data-${progress.funnelId}-${Date.now()}`,
          type: 'complete_data',
          title: `Complete ${progress.funnel.name} Information`,
          description: `Provide missing information: ${missingDataPoints[0].name}`,
          priority: 2,
          action: {
            type: 'form',
            target: `/funnels/${progress.funnelId}/data`,
            metadata: {
              missingFields: missingDataPoints.map(dp => dp.name)
            }
          }
        });
      }

      // Check for next milestone
      const incompleteMilestones = progress.funnel.milestones.filter(m =>
        !progress.milestones.some(pm => 
          pm.milestoneId === m.id && pm.completedAt
        )
      ).sort((a, b) => a.order - b.order);

      if (incompleteMilestones[0]) {
        suggestions.push({
          id: `milestone-${progress.funnelId}-${Date.now()}`,
          type: 'milestone_action',
          title: `Complete ${incompleteMilestones[0].name}`,
          description: incompleteMilestones[0].description || 'Move forward with your next milestone',
          priority: 3,
          action: {
            type: 'navigate',
            target: `/funnels/${progress.funnelId}/milestones/${incompleteMilestones[0].id}`
          }
        });
      }
    }

    // Check for new funnels user can start (prerequisites met)
    for (const funnel of allFunnels) {
      const alreadyStarted = funnelProgress.some(p => p.funnelId === funnel.id);
      if (!alreadyStarted) {
        const prerequisites = await prisma.funnelPrerequisite.findMany({
          where: { funnelId: funnel.id },
          include: { prerequisiteFunnel: true }
        });

        const prerequisitesMet = prerequisites.every(pre => 
          funnelProgress.some(p => 
            p.funnelId === pre.prerequisiteFunnelId && 
            p.completedAt !== null
          )
        );

        if (prerequisitesMet) {
          suggestions.push({
            id: `new-funnel-${funnel.id}-${Date.now()}`,
            type: 'start_funnel',
            title: `Start ${funnel.name}`,
            description: funnel.description || 'Begin your next marketing journey phase',
            priority: 4,
            action: {
              type: 'navigate',
              target: `/funnels/${funnel.id}/start`
            }
          });
        }
      }
    }

    // Sort by priority and limit number of suggestions
    const finalSuggestions = suggestions
      .sort((a, b) => a.priority - b.priority)
      .slice(0, MAX_SUGGESTIONS);

    return res.status(200).json({
      suggestions: finalSuggestions
    });

  } catch (error) {
    console.error('Failed to generate suggestions:', error);
    return res.status(500).json({ error: 'Failed to generate suggestions' });
  } finally {
    await prisma.$disconnect();
  }
}