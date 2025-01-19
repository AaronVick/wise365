/**
 * File: /api/agents/capabilities.ts
 * 
 * Description: 
 * Retrieves and analyzes agent capabilities based on their stored data
 * and defined characteristics. Uses Not Diamond to provide dynamic capability insights.
 * 
 * Related Files:
 * - /services/agents/capability-analyzer.service.ts
 * - Database Models: Agent, AgentData
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { NotDiamondService } from '../../../services/routing/implementations/not-diamond.service';
import { formatApiResponse, handleApiError } from '../../../lib/api-utils';

const notDiamondService = new NotDiamondService();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return handleApiError(res, new Error('Method not allowed'), 'Only GET method is allowed');
  }

  try {
    const { agentId } = req.query;

    // Fetch agent with all related data
    const agent = await prisma.agent.findUnique({
      where: { id: agentId as string },
      include: {
        agentData: true,
        agentsDefined: {
          where: { active: true }
        }
      }
    });

    if (!agent) {
      return res.status(404).json(formatApiResponse(null, 'Agent not found', false));
    }

    // Route capability analysis to optimal LLM
    const routingConfig = await notDiamondService.routeTask({
      taskType: 'agentCapabilityAnalysis',
      content: agent
    });

    // Analyze capabilities using selected LLM
    const capabilities = await routingConfig.llm.analyze({
      agent,
      prompt: "Analyze this agent's capabilities based on their data and defined characteristics..."
    });

    return res.status(200).json(formatApiResponse({
      agent: {
        id: agent.id,
        name: agent.name,
        role: agent.role,
        category: agent.category
      },
      capabilities: capabilities.analysis,
      specialties: capabilities.specialties,
      limitations: capabilities.limitations
    }));

  } catch (error) {
    console.error('Error fetching agent capabilities:', error);
    return handleApiError(res, error, 'Failed to fetch agent capabilities');
  }
}