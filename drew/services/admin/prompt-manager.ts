// services/admin/prompt-manager.ts

/**
 * Service for managing agent prompts in admin context
 * 
 * Works with:
 * - services/agent-context.ts
 * - models/AgentDefinition
 * - models/ConversationAnalysis
 * 
 * Handles prompt generation, versioning, and management for different LLM providers
 */

import { prisma } from '@/lib/prisma';

interface PromptVersion {
  description: string;
  version: number;
  lastUpdated: Date;
  metadata?: Record<string, any>;
}

interface PromptGeneration {
  agentId: string;
  llmProvider: 'openai' | 'anthropic';
  context?: Record<string, any>;
}

export async function generateAgentPrompt(data: PromptGeneration) {
  // Get agent's current data and history
  const agent = await prisma.agentDefinition.findUnique({
    where: { id: data.agentId },
    include: {
      prompts: {
        where: { llmProvider: data.llmProvider },
        orderBy: { version: 'desc' },
        take: 1
      }
    }
  });

  if (!agent) {
    throw new Error('Agent not found');
  }

  // Structure for prompt generation
  const promptContext = {
    agentRole: agent.role,
    specialties: agent.specialties,
    previousPrompts: agent.prompts,
    currentVersion: agent.prompts[0]?.version || 0,
    ...data.context
  };

  return promptContext;
}

export async function saveAgentPrompt(
  agentId: string,
  llmProvider: string,
  promptData: PromptVersion
) {
  return await prisma.agentDefinition.update({
    where: { id: agentId },
    data: {
      prompts: {
        create: {
          description: promptData.description,
          version: promptData.version,
          llmProvider,
          lastUpdated: new Date(),
          metadata: promptData.metadata
        }
      }
    }
  });
}