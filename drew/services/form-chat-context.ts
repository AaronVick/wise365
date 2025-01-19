// services/form-chat-context.ts
/**
 * Service for managing form chat context and state
 * 
 * Works with:
 * - models/UserConversation
 * - services/conversation-manager.ts
 * - services/form-manager.ts
 * 
 * Handles chat context and state management for form-specific conversations
 */

import { prisma } from '@/lib/prisma';

interface FormChatState {
  chatId: string;
  formId: string;
  userId: string;
  agentId: string;
  context: {
    form: FormContext;
    agent: AgentMatch;
    conversation: {
      id: string;
      status: string;
      progress: number;
    };
  };
}

export async function initializeFormChat(
  formId: string,
  userId: string,
  teamId?: string
): Promise<FormChatState> {
  // Get form context
  const formContext = await getFormContext(formId, userId, teamId);

  // Find best matching agent
  const agentMatch = await findBestFormAgent({
    formId,
    userId,
    teamId
  });

  // Create or get existing conversation
  const conversation = await prisma.userConversation.upsert({
    where: {
      uniqueFormChat: {
        userId,
        formId
      }
    },
    create: {
      userId,
      agentId: agentMatch.agentId,
      metadata: {
        formId,
        purpose: 'form_assistance',
        context: formContext
      }
    },
    update: {
      lastMessage: new Date()
    }
  });

  return {
    chatId: conversation.id,
    formId,
    userId,
    agentId: agentMatch.agentId,
    context: {
      form: formContext,
      agent: agentMatch,
      conversation: {
        id: conversation.id,
        status: 'active',
        progress: 0
      }
    }
  };
}

// Helper functions
async function getFunnelContext(
  funnelId: string,
  userId: string,
  teamId?: string
) {
  const progress = await prisma.funnelProgress.findFirst({
    where: {
      funnelId,
      OR: [
        { userId },
        { teamId: teamId || '' }
      ]
    },
    include: {
      milestones: true
    }
  });

  return {
    id: funnelId,
    currentProgress: progress?.completionPercentage || 0,
    relevantMilestones: progress?.milestones || []
  };
}

async function getUserContext(userId: string, teamId?: string) {
  // Implementation to get relevant user context
  return {};
}

async function generateContextualPrompt(
  agentId: string,
  context: any
): Promise<string> {
  // Implementation to generate context-aware prompt
  return '';
}