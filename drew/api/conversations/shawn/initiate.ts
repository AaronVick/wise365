// api/conversations/shawn/initiate.ts

/**
 * Initializes or continues conversation with Shawn based on comprehensive user and team context.
 * 
 * This API determines whether the user is new or returning, gathers relevant context
 * about their progress, team activities, cross-agent interactions, and next steps.
 * It provides Shawn with a complete picture of the user's journey and team context
 * for more meaningful interactions.
 * 
 * @description Initiates or continues Shawn conversation with comprehensive context
 * 
 * This route works with:
 * - api/suggestions/actions: Gets next steps and suggestions
 * - api/navigation/sidebar_agents: Gets conversation history
 * - services/funnel-progress.ts: Gets current funnel state
 * - services/user-progress.ts: Gets overall progress
 * - services/team/highlight-generator.ts: Gets team insights
 * - models/UserConversation: Manages conversation state
 * - models/ConversationAnalysis: Analyzes conversation patterns
 */

import { PrismaClient } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';

interface AgentInteraction {
  agentName: string;
  lastInteraction: Date;
  topic: string;
  status: 'ongoing' | 'completed';
  outcome?: string;
}

interface TeamActivity {
  type: string;
  member: string;
  action: string;
  resource: string;
  timestamp: Date;
}

interface GlobalProgress {
  milestone: string;
  status: string;
  contributors: string[];
  lastUpdate: Date;
}

interface ShawnContext {
  isNewUser: boolean;
  currentFunnel?: {
    name: string;
    progress: number;
    currentMilestone?: string;
  };
  suggestedActions: Array<{
    type: string;
    title: string;
    description: string;
  }>;
  recentActivity?: Array<{
    type: string;
    description: string;
    timestamp: Date;
  }>;
  previousConversation?: {
    lastMessageTimestamp: Date;
    topic?: string;
  };
  // New fields for expanded context
  agentInteractions: AgentInteraction[];
  teamActivity: TeamActivity[];
  globalProgress: GlobalProgress[];
  collaborationInsights: {
    activeProjects: string[];
    sharedMilestones: string[];
    pendingTeamActions: string[];
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const prisma = new PrismaClient();
  const { userId, teamId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    // Get user's basic info and check if they're new
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        completedOnboarding: true,
        createdAt: true,
        name: true,
        lastActive: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get all agent interactions
    const agentInteractions = await prisma.userConversation.findMany({
      where: {
        userId,
        NOT: {
          agentId: 'shawn' // Exclude Shawn's conversations
        }
      },
      include: {
        agent: true,
        analysis: {
          orderBy: {
            analyzedAt: 'desc'
          },
          take: 1
        }
      },
      orderBy: {
        lastMessage: 'desc'
      }
    });

    // Get team activities
    const teamActivities = await prisma.conversationAnalysis.findMany({
      where: {
        conversation: {
          teamId: teamId || undefined,
          NOT: {
            userId
          }
        }
      },
      include: {
        conversation: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        analyzedAt: 'desc'
      },
      take: 10
    });

    // Get global milestone progress
    const globalProgress = await prisma.milestoneProgress.findMany({
      where: {
        progress: {
          teamId: teamId || undefined
        }
      },
      include: {
        milestone: true,
        progress: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        completedAt: 'desc'
      }
    });

    // Get collaborative projects and shared milestones
    const collaborationData = await Promise.all([
      prisma.project.findMany({
        where: {
          OR: [
            { userId },
            { teamId: teamId || undefined }
          ]
        },
        include: {
          goals: true
        }
      }),
      prisma.funnelProgress.findMany({
        where: {
          teamId: teamId || undefined
        },
        include: {
          milestones: true
        }
      })
    ]);

    // Build enhanced context for Shawn
    const context: ShawnContext = {
      isNewUser: !user.completedOnboarding,
      // ... (previous context fields remain the same)
      
      // New context fields
      agentInteractions: agentInteractions.map(interaction => ({
        agentName: interaction.agent.name,
        lastInteraction: interaction.lastMessage,
        topic: interaction.metadata?.topic as string || 'General Discussion',
        status: interaction.metadata?.status as 'ongoing' | 'completed',
        outcome: interaction.analysis[0]?.findings?.outcome as string
      })),

      teamActivity: teamActivities.map(activity => ({
        type: activity.serviceType,
        member: activity.conversation.user.name,
        action: activity.findings.action as string,
        resource: activity.findings.resource as string,
        timestamp: activity.analyzedAt
      })),

      globalProgress: globalProgress.map(progress => ({
        milestone: progress.milestone.name,
        status: progress.status,
        contributors: [progress.progress.user.name],
        lastUpdate: progress.completedAt || progress.startedAt
      })),

      collaborationInsights: {
        activeProjects: collaborationData[0].map(p => p.name),
        sharedMilestones: collaborationData[1]
          .flatMap(fp => fp.milestones)
          .map(m => m.milestone.name),
        pendingTeamActions: collaborationData[0]
          .flatMap(p => p.goals)
          .filter(g => g.status === 'PENDING')
          .map(g => g.title)
      }
    };

    // Create or continue conversation with Shawn
    const conversation = await prisma.userConversation.create({
      data: {
        userId,
        teamId: teamId || undefined,
        agentId: 'shawn',
        metadata: {
          context,
          isOnboarding: context.isNewUser,
          suggestedFlow: context.isNewUser ? 'onboarding' : 'continuation',
          lastUserState: {
            completedOnboarding: user.completedOnboarding,
            lastActive: user.lastActive
          }
        }
      }
    });

// for the LLM to use in generating an appropriate response

return res.status(200).json({
  conversationId: conversation.id,
  context: {
    // All our rich context for the LLM to use
    userInfo: {
      isNewUser: !user.completedOnboarding,
      name: user.name,
      lastActive: user.lastActive
    },
    agentInteractions,
    teamActivity,
    globalProgress,
    collaborationInsights,
    // Include anything else the LLM might need to craft a personalized message
    currentState: {
      activeFunnels: funnelProgress,
      suggestedActions,
      pendingMilestones: globalProgress.filter(p => !p.completedAt),
      teamCollaboration: collaborationData
    }
  }
});

    return res.status(200).json({
      conversationId: conversation.id,
      context,
      initialMessage
    });

  } catch (error) {
    console.error('Failed to initiate Shawn conversation:', error);
    return res.status(500).json({ error: 'Failed to initiate conversation' });
  } finally {
    await prisma.$disconnect();
  }
}