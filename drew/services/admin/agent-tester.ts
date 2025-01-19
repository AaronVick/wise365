// services/admin/agent-tester.ts
/**
 * Service for testing agent interactions in admin context
 * 
 * Works with:
 * - services/conversation-manager.ts
 * - services/conversation-analyzer.ts
 * - models/ConversationAnalysis
 * 
 * Provides functionality for testing agent responses and analyzing effectiveness
 */

import { prisma } from '@/lib/prisma';

interface TestSession {
  agentId: string;
  llmProvider: string;
  prompt: string;
  message: string;
  conversationId?: string;
}

export async function createTestSession(data: TestSession) {
  // Create test conversation
  const conversation = await prisma.userConversation.create({
    data: {
      agentId: data.agentId,
      userId: 'admin',
      metadata: {
        isTest: true,
        llmProvider: data.llmProvider,
        prompt: data.prompt
      }
    }
  });

  return conversation;
}

export async function analyzeTestResults(conversationId: string) {
  const results = await prisma.conversationAnalysis.findMany({
    where: {
      conversation: {
        id: conversationId,
        metadata: {
          path: ['isTest'],
          equals: true
        }
      }
    },
    include: {
      conversation: {
        include: {
          messages: true
        }
      }
    }
  });

  return {
    messageCount: results[0]?.conversation.messages.length || 0,
    relevantResponses: results.filter(r => r.isRelevant).length,
    dataPoints: results.reduce((acc, r) => {
      if (r.extractedData) {
        acc.push(...(r.extractedData as any).dataPoints || []);
      }
      return acc;
    }, [])
  };
}