// services/admin/agent-manager.ts
/**
 * Service for managing agent definitions and configurations
 * 
 * Works with:
 * - models/AgentDefinition
 * - services/prompt-manager.ts
 * - services/agent-context.ts
 * 
 * Handles agent creation, updates, and configuration management
 */

import { prisma } from '@/lib/prisma';

interface AgentDefinition {
  name: string;
  role: string;
  category: string;
  specialties: string[];
  prompts?: Record<string, PromptVersion>;
}

export async function createAgent(definition: AgentDefinition) {
  return await prisma.agentDefinition.create({
    data: {
      name: definition.name,
      role: definition.role,
      category: definition.category,
      specialties: definition.specialties,
      isActive: true,
      prompts: {
        create: Object.entries(definition.prompts || {}).map(([provider, prompt]) => ({
          llmProvider: provider,
          description: prompt.description,
          version: prompt.version,
          lastUpdated: new Date(),
          metadata: prompt.metadata
        }))
      }
    }
  });
}