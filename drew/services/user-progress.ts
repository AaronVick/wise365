// services/user-progress.ts

/**
 * Service for tracking and managing user progress across the system
 * 
 * Works with:
 * - models/FunnelProgress
 * - models/MilestoneProgress
 * - services/funnel-analyzer.ts
 * 
 * Handles progress tracking, milestone completion, and progress analytics
 */

import { prisma } from '@/lib/prisma';

export async function getUserProgress(userId: string, teamId?: string) {
  const progress = await prisma.funnelProgress.findMany({
    where: {
      OR: [
        { userId },
        { teamId: teamId || '' }
      ]
    },
    include: {
      funnel: true,
      milestones: {
        include: {
          milestone: true
        }
      },
      dataPoints: true
    }
  });

  return progress;
}