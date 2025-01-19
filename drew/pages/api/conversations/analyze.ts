// pages/api/conversations/analyze.ts

/**
 * API endpoint for analyzing conversations
 * 
 * @path POST /api/conversations/analyze
 * Works with:
 * - services/conversation-analyzer.ts
 * - models/ConversationAnalysis
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { analyzeConversation } from '@/services/conversation-analyzer';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { conversationId } = req.body;

    if (!conversationId) {
      return res.status(400).json({ error: 'Conversation ID required' });
    }

    const analysis = await analyzeConversation(conversationId);
    return res.status(200).json(analysis);
  } catch (error) {
    console.error('Error analyzing conversation:', error);
    return res.status(500).json({ error: 'Failed to analyze conversation' });
  }
}