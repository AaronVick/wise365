/**
 * File: /api/agents/match.ts
 * 
 * Description: 
 * Matches users with the most suitable agent based on context, user needs,
 * and agent capabilities. Uses Not Diamond for optimal LLM selection to analyze
 * the match requirements and agent profiles.
 * 
 * Related Files:
 * - /services/routing/implementations/not-diamond.service.ts
 * - /services/agents/matcher.service.ts
 * - Database Models: Agent, AgentData, AgentsDefined
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { NotDiamondService } from '../../../services/routing/implementations/not-diamond.service';
import { prisma } from '../../../lib/prisma';
import { formatApiResponse, handleApiError } from '../../../lib/api-utils';

const notDiamondService = new NotDiamondService();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return handleApiError(res, new Error('Method not allowed'), 'Only POST method is allowed');
  }

  try {
    const { userId, context, requirements } = req.body;

    // Fetch all active agents with their data and definitions
    const agents = await prisma.agent.findMany({
      where: { active: true },
      include: {
        agentData: true,
        agentsDefined: {
          where: { active: true }
        }
      }
    });

    // Get optimal LLM for matching analysis
    const routingConfig = await notDiamondService.routeTask({
      taskType: 'agentMatching',
      content: {
        context,
        requirements,
        availableAgents: agents
      }
    });

    // Analyze agent compatibility using the selected LLM
    const llmResponse = await routingConfig.llm.analyze({
      agents,
      context,
      requirements,
      prompt: "Based on the user's context and requirements, analyze each agent's suitability..."
    });

    // Find best matching agent
    const bestMatch = await prisma.agent.findUnique({
      where: { id: llmResponse.bestMatchId },
      include: {
        agentData: {
          where: { dataType: 'PERSONALITY' }
        }
      }
    });

    if (!bestMatch) {
      return res.status(404).json(formatApiResponse(null, 'No suitable agent found', false));
    }

    // Log the match for analysis
    await prisma.routingHistory.create({
      data: {
        conversationId: context.conversationId || '',
        messageId: context.messageId || '',
        notDiamondRoute: routingConfig,
        actualRoute: {
          agentId: bestMatch.id,
          matchScore: llmResponse.matchScore,
          reasoningFactors: llmResponse.factors
        },
        reason: llmResponse.reasoning,
        performance: {}
      }
    });

    return res.status(200).json(formatApiResponse({
      agent: bestMatch,
      matchConfidence: llmResponse.matchScore,
      reasoning: llmResponse.reasoning
    }));

  } catch (error) {
    console.error('Error matching agent:', error);
    return handleApiError(res, error, 'Failed to match agent');
  }
}