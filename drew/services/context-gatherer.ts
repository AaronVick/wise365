// services/context-gatherer.ts

/**
 * Service for gathering and managing conversation context
 * 
 * Collects relevant context including funnel progress, previous interactions,
 * and milestone status
 */

import { prisma } from '@/lib/prisma';

export async function getConversationContext(conversationId: string) {
  const conversation = await prisma.userConversation.findUnique({
    where: { id: conversationId },
    include: {
      user: true,
      messages: {
        orderBy: { timestamp: 'desc' },
        take: 10
      },
      analysis: {
        orderBy: { analyzedAt: 'desc' },
        take: 1
      }
    }
  });

  if (!conversation) {
    throw new Error('Conversation not found');
  }

  // Get funnel context if applicable
  let funnelContext = null;
  if (conversation.funnelId) {
    funnelContext = await prisma.funnelProgress.findFirst({
      where: {
        funnelId: conversation.funnelId,
        userId: conversation.userId
      },
      include: {
        funnel: true,
        milestones: true
      }
    });
  }

  return {
    conversationId,
    user: {
      id: conversation.userId,
      name: conversation.user.name
    },
    recentMessages: conversation.messages,
    lastAnalysis: conversation.analysis[0],
    funnelContext
  };
}