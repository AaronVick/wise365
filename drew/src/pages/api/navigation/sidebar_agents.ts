// pages/api/navigation/sidebar_agents.ts

/**
 * Handles retrieval of sidebar navigation data including agents and their conversations.
 * 
 * This API endpoint provides hierarchical data for the sidebar navigation, organizing
 * agents by their categories and including both main conversations and sub-chats.
 * It ensures proper ordering with administrative agents (like Shawn) appearing first.
 * 
 * @description Gets all agents and their associated conversations, organized by category
 * for sidebar display. Includes main agent conversations and named sub-conversations.
 * 
 * This route works with:
 * - models/Agent (Prisma model for agent data)
 * - models/UserConversation (Prisma model for conversations)
 * - models/ConversationName (Prisma model for named conversations)
 * - types/AgentCategory (enum for agent categories)
 * 
 * @requires userId to be provided as a query parameter
 * @returns Hierarchical structure of agents and conversations by category
 */

import { PrismaClient } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';

// Interface for sub-conversations under an agent
interface SubChat {
  id: string;
  name: string;
  lastMessage: Date;
}

// Interface for main agent conversation and associated data
interface AgentChat {
  id: string;              // Main conversation ID
  agentId: string;
  agentName: string;
  category: string;        // From AgentCategory enum
  lastMessage: Date;
  subChats: SubChat[];     // Named sub-conversations
}

// Response structure for the sidebar API
interface SidebarResponse {
  categories: {
    [key: string]: AgentChat[];  // Organized by category
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const prisma = new PrismaClient();
  const { userId } = req.query;

  // Validate required userId parameter
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    // Fetch all active agents with their most recent main conversation
    // Main conversations are those without a nameId (not a sub-chat)
    const agents = await prisma.agent.findMany({
      where: {
        active: true,
      },
      include: {
        conversations: {
          where: {
            userId: userId as string,
            nameId: null, // Main conversations only
          },
          orderBy: {
            lastMessage: 'desc'
          },
          take: 1, // Most recent conversation only
        }
      },
      orderBy: [
        {
          // Ensure administrative agents (like Shawn) appear first
          category: 'asc'
        },
        {
          name: 'asc'
        }
      ]
    });

    // Fetch all sub-conversations (named chats) for all agents
    // These are conversations with a nameId
    const subConversations = await prisma.userConversation.findMany({
      where: {
        userId: userId as string,
        NOT: {
          nameId: null
        }
      },
      include: {
        name: true,    // Include conversation name details
        agent: true    // Include agent details for mapping
      },
      orderBy: {
        lastMessage: 'desc'
      }
    });

    // Organize the data by agent categories
    const response: SidebarResponse = { categories: {} };

    // Process each agent and their conversations
    agents.forEach(agent => {
      // Initialize category array if it doesn't exist
      if (!response.categories[agent.category]) {
        response.categories[agent.category] = [];
      }

      const mainConversation = agent.conversations[0] || null;
      
      // Create the agent chat entry with main conversation and sub-chats
      const agentChat: AgentChat = {
        id: mainConversation?.id || '', // Empty string if no conversation exists
        agentId: agent.id,
        agentName: agent.name,
        category: agent.category,
        lastMessage: mainConversation?.lastMessage || new Date(),
        // Filter and map sub-conversations for this agent
        subChats: subConversations
          .filter(conv => conv.agentId === agent.id)
          .map(conv => ({
            id: conv.id,
            name: conv.name?.name || 'Unnamed Chat',
            lastMessage: conv.lastMessage
          }))
      };

      response.categories[agent.category].push(agentChat);
    });

    // Ensure categories are in the correct display order
    // This matches the sidebar UI requirements
    const orderedCategories = {
      'ADMINISTRATIVE': response.categories['ADMINISTRATIVE'] || [],
      'MARKETING': response.categories['MARKETING'] || [],
      'SALES': response.categories['SALES'] || [],
      'SOCIAL_MEDIA': response.categories['SOCIAL_MEDIA'] || [],
      'COPY_EDITING': response.categories['COPY_EDITING'] || [],
    };

    return res.status(200).json({ categories: orderedCategories });

  } catch (error) {
    console.error('Sidebar navigation error:', error);
    return res.status(500).json({ error: 'Failed to fetch navigation data' });
  } finally {
    await prisma.$disconnect();
  }
}