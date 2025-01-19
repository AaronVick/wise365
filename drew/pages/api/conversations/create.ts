// pages/api/conversations/create.ts
/**
 * API endpoint for creating new conversations
 * 
 * @path POST /api/conversations/create
 * Works with:
 * - models/UserConversation
 * - services/conversation-manager.ts
 */
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { initializeConversation } from '@/services/conversation-manager';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      userId,
      agentId,
      projectId,
      funnelId,
      milestoneId,
      metadata
    } = req.body;

    const conversation = await initializeConversation({
      userId,
      agentId,
      projectId,
      funnelId,
      milestoneId,
      metadata
    });

    return res.status(200).json(conversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    return res.status(500).json({ error: 'Failed to create conversation' });
  }
}