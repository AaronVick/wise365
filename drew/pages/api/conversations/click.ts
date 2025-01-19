// pages/api/conversations/click.ts
// Handles conversation click actions: 
// fetch context, start new conversations, package for agent

import { NextApiRequest, NextApiResponse } from 'next';
import { getContext } from '../../../services/context-gatherer';
import { createConversation } from '../../../services/conversation-manager';
import { packageAgentContext } from '../../../services/agent-context';
import { logMessage } from '../../../services/conversation-manager';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { teamId, userId, conversationId, conversationName, promptInjection } = req.body;

  try {
    let context;

    if (conversationId) {
      // Fetch existing context
      context = await getContext(conversationId);
    } else {
      // Start a new conversation
      context = await createConversation({ teamId, userId, conversationName });
    }

    // Package for agent if a promptInjection is required
    if (promptInjection) {
      const agentData = await packageAgentContext({ context, userId, promptInjection });
      // Send to agent (assuming you have an agent interaction service here)
      await logMessage(agentData);
    }

    res.status(200).json({ success: true, context });
  } catch (error) {
    console.error('Error in conversation click handler:', error.message);
    res.status(500).json({ error: 'Failed to process conversation click' });
  }
}
