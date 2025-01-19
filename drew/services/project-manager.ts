// services/project-manager.ts

/**
 * Service for managing projects and their relationships
 * 
 * Works with:
 * - models/UserConversation
 * - services/conversation-manager.ts
 * - services/funnel-progress.ts
 * 
 * This service handles project creation, updates, and relationship management
 * between projects, conversations, and funnels.
 */

import { prisma } from '@/lib/prisma';

interface ProjectInit {
  userId: string;
  teamId?: string;
  name: string;
  description?: string;
  metadata?: Record<string, any>;
}

export async function createProject(data: ProjectInit) {
  return await prisma.$transaction(async (tx) => {
    // Create the project
    const project = await tx.project.create({
      data: {
        name: data.name,
        description: data.description,
        metadata: data.metadata,
        userId: data.userId,
        teamId: data.teamId,
        status: 'active'
      }
    });

    // Initialize any required funnel progress
    await tx.funnelProgress.create({
      data: {
        userId: data.userId,
        teamId: data.teamId,
        funnelId: 'onboarding', // Start with onboarding funnel
        status: 'not_started',
        completionPercentage: 0
      }
    });

    return project;
  });
}