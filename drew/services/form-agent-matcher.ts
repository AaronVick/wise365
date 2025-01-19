// services/form-agent-matcher.ts
/**
 * Service for matching forms with appropriate agents
 * 
 * Works with:
 * - models/AgentDefinition
 * - models/Resources
 * - services/agent-context.ts
 * 
 * Handles agent selection and prompt preparation for form-specific interactions
 */

import { prisma } from '@/lib/prisma';

interface AgentMatch {
  agentId: string;
  name: string;
  contextualPrompt: string;
  confidence: number;
}

interface MatchContext {
  formId: string;
  userId: string;
  teamId?: string;
  funnelId?: string;
}

export async function findBestFormAgent(
  context: MatchContext
): Promise<AgentMatch> {
  // Get all necessary context
  const [formData, agents] = await Promise.all([
    getFormContext(context.formId, context.userId, context.teamId),
    prisma.agentDefinition.findMany({
      where: { isActive: true },
      include: {
        prompts: {
          where: {
            OR: [
              { llmProvider: 'anthropic' },
              { llmProvider: 'openai' }
            ]
          }
        }
      }
    })
  ]);

  // Structure data for agent matching
  const matchingContext = {
    form: formData.template,
    funnel: formData.funnel,
    userContext: await getUserContext(context.userId, context.teamId),
    agentCapabilities: agents.map(agent => ({
      id: agent.id,
      name: agent.name,
      specialties: agent.specialties,
      relevantPrompts: agent.prompts
    }))
  };

  // Return best matching agent with context
  return {
    agentId: 'best_matching_agent_id', // This would be determined by your matching logic
    name: 'Agent Name',
    contextualPrompt: await generateContextualPrompt(
      'best_matching_agent_id',
      matchingContext
    ),
    confidence: 0.95
  };
}