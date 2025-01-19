/**
 * File: /api/agents/handoff.ts
 * 
 * Description: 
 * Manages the handoff process between agents, ensuring context preservation
 * and smooth transition. Uses Not Diamond to analyze handoff requirements
 * and prepare agents for the transition.
 * 
 * Related Files:
 * - /services/agents/handoff.service.ts
 * - /services/conversations/context.service.ts
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { NotDiamondService } from '../../../services/routing/implementations/not-diamond.service';
import { formatApiResponse, handleApiError } from '../../../lib/api-utils';

const notDiamondService = new NotDiamondService();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return handleApiError(res, new Error('Method not allowed'), 'Only POST method is allowed');
  }

  try {
    const { 
      currentAgentId, 
      targetAgentId, 
      conversationId,
      reason 
    } = req.body;

    // Verify both agents exist and are active
    const [currentAgent, targetAgent] = await Promise.all([
      prisma.agent.findUnique({ 
        where: { id: currentAgentId },
        include: { agentData: true }
      }),
      prisma.agent.findUnique({ 
        where: { id: targetAgentId },
        include: { agentData: true }
      })
    ]);

    if (!currentAgent || !targetAgent) {
      return res.status(404).json(formatApiResponse(null, 'One or both agents not found', false));
    }

    // Fetch conversation context
    const conversation = await prisma.userConversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: true,
        analysis: true
      }
    });

    // Route handoff analysis to optimal LLM
    const routingConfig = await notDiamondService.routeTask({
      taskType: 'agentHandoff',
      content: {
        conversation,
        currentAgent,
        targetAgent,
        reason
      }
    });

    // Prepare handoff context using selected LLM
    const handoffContext = await routingConfig.llm.analyze({
      conversation,
      currentAgent,
      targetAgent,
      prompt: "Prepare handoff context and instructions for the target agent..."
    });

    // Create new conversation with target agent
    const newConversation = await prisma.userConversation.create({
      data: {
        userId: conversation.userId,
        agentId: targetAgent.id,
        projectId: conversation.projectId,
        funnelId: conversation.funnelId,
        milestoneId: conversation.milestoneId,
        metadata: {
          handoffFrom: currentAgent.id,
          handoffReason: reason,
          preservedContext: handoffContext.preservedContext
        }
      }
    });

    // Record handoff in routing history
    await prisma.routingHistory.create({
      data: {
        conversationId,
        messageId: conversation.messages[conversation.messages.length - 1].id,
        notDiamondRoute: routingConfig,
        actualRoute: {
          handoffTo: targetAgent.id,
          reason,
          preservedContext: handoffContext.preservedContext
        },
        reason: handoffContext.reasoning,
        performance: {}
      }
    });

    return res.status(200).json(formatApiResponse({
      newConversationId: newConversation.id,
      handoffContext: handoffContext.preservedContext,
      targetAgent: {
        id: targetAgent.id,
        name: targetAgent.name,
        role: targetAgent.role
      }
    }));

  } catch (error) {
    console.error('Error handling agent handoff:', error);
    return handleApiError(res, error, 'Failed to complete agent handoff');
  }
}