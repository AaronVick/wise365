// pages/api/conversations/access.ts

/**
 * Handles access to agent conversations, either main chats or sub-chats.
 * Creates new conversations if they don't exist or retrieves existing ones.
 * 
 * This API supports two scenarios:
 * 1. Accessing main agent conversations (default agent chat)
 * 2. Accessing named sub-chats under an agent
 * 
 * @description Creates or retrieves agent conversations and their history
 * 
 * This route works with:
 * - api/conversations/shawn/initiate: For Shawn's special context handling
 * - models/UserConversation: Manages conversation state
 * - models/ConversationMessage: Chat history
 * - models/ConversationName: Named sub-chats
 * - models/Agent: Agent information
 */

import { PrismaClient } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';

interface ConversationResponse {
  conversationId: string;
  isNew: boolean;
  messages: Array<{
    id: string;
    role: string;
    content: string;
    contentType: string;
    timestamp: Date;
  }>;
  agent: {
    id: string;
    name: string;
    category: string;
  };
  metadata?: any;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const prisma = new PrismaClient();
  const { userId, agentId, subChatId, subChatName } = req.body;

  if (!userId || !agentId) {
    return res.status(400).json({ error: 'userId and agentId are required' });
  }

  try {
    // Special handling for Shawn if this is a main conversation
    if (agentId === 'shawn' && !subChatId) {
      // Redirect to Shawn's specialized initiation endpoint
      const response = await fetch('/api/conversations/shawn/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      return res.status(200).json(await response.json());
    }

    // Find existing conversation or create new one
    let conversation;
    let isNew = false;

    if (subChatId) {
      // Accessing specific sub-chat
      conversation = await prisma.userConversation.findUnique({
        where: { id: subChatId },
        include: {
          messages: {
            orderBy: { timestamp: 'asc' }
          },
          agent: {
            select: {
              id: true,
              name: true,
              category: true
            }
          }
        }
      });
    } else if (subChatName) {
      // Creating or accessing named sub-chat
      let conversationName = await prisma.conversationName.findFirst({
        where: {
          userId,
          name: subChatName,
          conversations: {
            some: {
              agentId
            }
          }
        }
      });

      if (!conversationName) {
        conversationName = await prisma.conversationName.create({
          data: {
            userId,
            name: subChatName,
            metadata: {}
          }
        });
        isNew = true;
      }

      conversation = await prisma.userConversation.create({
        data: {
          userId,
          agentId,
          nameId: conversationName.id,
          metadata: {}
        },
        include: {
          messages: {
            orderBy: { timestamp: 'asc' }
          },
          agent: {
            select: {
              id: true,
              name: true,
              category: true
            }
          }
        }
      });
    } else {
      // Find or create main agent conversation
      conversation = await prisma.userConversation.findFirst({
        where: {
          userId,
          agentId,
          nameId: null // Main conversations have no nameId
        },
        include: {
          messages: {
            orderBy: { timestamp: 'asc' }
          },
          agent: {
            select: {
              id: true,
              name: true,
              category: true
            }
          }
        }
      });

      if (!conversation) {
        conversation = await prisma.userConversation.create({
          data: {
            userId,
            agentId,
            metadata: {}
          },
          include: {
            messages: {
              orderBy: { timestamp: 'asc' }
            },
            agent: {
              select: {
                id: true,
                name: true,
                category: true
              }
            }
          }
        });
        isNew = true;
      }
    }

    const response: ConversationResponse = {
      conversationId: conversation.id,
      isNew,
      messages: conversation.messages,
      agent: conversation.agent,
      metadata: conversation.metadata
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('Conversation access error:', error);
    return res.status(500).json({ error: 'Failed to access conversation' });
  } finally {
    await prisma.$disconnect();
  }
}