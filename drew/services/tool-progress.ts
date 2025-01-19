// services/tool-progress.ts

/**
 * Service for managing progress in specific tools (Success Wheel, Buyer Persona, etc.)
 * 
 * Works with:
 * - models/ResourcesData
 * - models/FunnelProgress
 * - services/funnel-analyzer.ts
 * 
 * Handles tool-specific progress tracking and data management
 */

import { prisma } from '@/lib/prisma';

interface ToolProgress {
  userId: string;
  teamId?: string;
  toolId: string;
  data: Record<string, any>;
}

export async function saveToolProgress(progress: ToolProgress) {
  return await prisma.$transaction(async (tx) => {
    // Save tool progress
    const savedProgress = await tx.resourcesData.create({
      data: {
        userId: progress.userId,
        teamId: progress.teamId,
        resourceId: progress.toolId,
        data: progress.data,
        version: 1
      }
    });

    // Update related funnel progress if needed
    if (progress.toolId === 'success-wheel') {
      await updateFunnelProgressFromWheel(tx, progress.userId, progress.data);
    }

    return savedProgress;
  });
}
