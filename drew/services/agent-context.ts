// services/agent-context.ts

/**
 * Service for managing agent context and preparing agent interactions
 * 
 * Works with:
 * - models/UserConversation
 * - services/conversation-analyzer.ts
 * - services/user-progress.ts
 * 
 * Handles preparation of agent context based on user progress and history
 */

import { prisma } from '@/lib/prisma';

interface AgentContext {
  userId: string;
  agentId: string;
  funnelId?: string;
  milestoneId?: string;
}

export async function prepareAgentContext(context: AgentContext) {
  const [userProgress, recentInteractions] = await Promise.all([
    // Get user's current progress
    prisma.funnelProgress.findMany({
      where: {
        userId: context.userId
      },
      include: {
        milestones: true,
        dataPoints: true
      }
    }),
    
    // Get recent interactions with this agent
    prisma.userConversation.findMany({
      where: {
        userId: context.userId,
        agentId: context.agentId
      },
      include: {
        messages: {
          orderBy: { timestamp: 'desc' },
          take: 10
        },
        analysis: {
          orderBy: { analyzedAt: 'desc' },
          take: 1
        }
      },
      orderBy: { lastMessage: 'desc' },
      take: 5
    })
  ]);

  return {
    progressContext: userProgress,
    interactionHistory: recentInteractions,
    currentFunnel: context.funnelId ? await getCurrentFunnelState(context.userId, context.funnelId) : null
  };
}