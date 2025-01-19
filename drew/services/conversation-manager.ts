// services/conversation-manager.ts

/**
 * Service for managing conversations
 * 
 * Handles conversation creation, updates, and message management
 * Works with Prisma models for UserConversation and ConversationMessage
 */

import { prisma } from '@/lib/prisma';

interface ConversationInit {
  userId: string;
  agentId: string;
  projectId?: string;
  funnelId?: string;
  milestoneId?: string;
  metadata?: Record<string, any>;
}

export async function initializeConversation(
  params: ConversationInit
) {
  return await prisma.userConversation.create({
    data: {
      userId: params.userId,
      agentId: params.agentId,
      projectId: params.projectId,
      funnelId: params.funnelId,
      milestoneId: params.milestoneId,
      metadata: params.metadata,
      startedAt: new Date(),
      lastMessage: new Date()
    }
  });
}