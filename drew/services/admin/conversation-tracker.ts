// services/admin/conversation-tracker.ts
/**
 * Service for tracking and analyzing conversations in admin context
 * 
 * Works with:
 * - services/conversation-analyzer.ts
 * - models/ConversationAnalysis
 * - models/UserConversation
 * 
 * Provides admin-level insights into conversation patterns and effectiveness
 */

import { prisma } from '@/lib/prisma';

export async function getConversationMetrics(agentId?: string) {
  const baseQuery = {
    where: agentId ? { agentId } : {},
    include: {
      messages: true,
      analysis: true
    }
  };

  const conversations = await prisma.userConversation.findMany(baseQuery);

  return {
    totalConversations: conversations.length,
    messageMetrics: {
      total: conversations.reduce((acc, conv) => acc + conv.messages.length, 0),
      averagePerConversation: conversations.reduce((acc, conv) => acc + conv.messages.length, 0) / conversations.length
    },
    effectiveness: {
      relevantInteractions: conversations.reduce((acc, conv) => 
        acc + conv.analysis.filter(a => a.isRelevant).length, 0),
      dataPointsCollected: conversations.reduce((acc, conv) => 
        acc + conv.analysis.reduce((sum, a) => 
          sum + ((a.extractedData as any)?.dataPoints?.length || 0), 0), 0)
    }
  };
}
