// pages/api/conversations/context.ts

/**
 * API endpoint for gathering conversation context
 * 
 * @path GET /api/conversations/context
 * Works with:
 * - services/context-gatherer.ts
 * - models/ConversationAnalysis
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { getConversationContext } from '@/services/context-gatherer';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { conversationId } = req.query;

    if (!conversationId || typeof conversationId !== 'string') {
      return res.status(400).json({ error: 'Conversation ID required' });
    }

    const context = await getConversationContext(conversationId);
    return res.status(200).json(context);
  } catch (error) {
    console.error('Error getting conversation context:', error);
    return res.status(500).json({ error: 'Failed to get conversation context' });
  }
}