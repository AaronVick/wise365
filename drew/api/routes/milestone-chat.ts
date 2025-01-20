// api/routes/milestone-chat.ts


/**
 * Handles the initialization of milestone-specific conversations between users and agents.
 * 
 * This route works with:
 * - services/generateInitialPrompt.ts (for creating the initial agent prompt)
 * - models/UserConversation (Prisma model for storing conversations)
 * - models/FunnelProgress (Prisma model for tracking progress)
 * 
 * @description Creates a new conversation with proper context for an agent to discuss 
 * a specific milestone. Gathers all relevant user, team, and funnel data to ensure 
 * the agent has complete context for the conversation. Returns conversation ID and 
 * context needed for the agent's response.
 * 
 * @requires generateInitialPrompt function to be implemented separately
 */


interface MilestoneChatContext {
  userId: string;
  teamId?: string;
  funnelId: string;
  milestoneId: string;
  agentId: string;
}

export async function initiateMilestoneChat(
  context: MilestoneChatContext
): Promise<{
  conversationId: string;
  agentContext: object;
  initialPrompt: string;
}> {
  const prisma = new PrismaClient();

  // Check for existing active conversation
  const existingConversation = await prisma.userConversation.findFirst({
    where: {
      userId: context.userId,
      funnelId: context.funnelId,
      milestoneId: context.milestoneId,
      status: 'active', // Assuming you have a status field to track conversation state
      metadata: {
        teamId: context.teamId,
        purpose: 'milestone_completion'
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  if (existingConversation) {
    // Get all necessary context for the agent
    const [user, funnel, milestone, funnelProgress, teamData] = await Promise.all([
      prisma.user.findUnique({ where: { id: context.userId } }),
      prisma.funnelDefinition.findUnique({ 
        where: { id: context.funnelId },
        include: { milestones: true, dataPoints: true }
      }),
      prisma.funnelMilestone.findUnique({ 
        where: { id: context.milestoneId } 
      }),
      prisma.funnelProgress.findFirst({
        where: {
          funnelId: context.funnelId,
          OR: [
            { userId: context.userId },
            { teamId: context.teamId || '' }
          ]
        },
        include: {
          analysis: {
            orderBy: { timestamp: 'desc' },
            take: 1
          }
        }
      }),
      context.teamId ? prisma.team.findUnique({ 
        where: { id: context.teamId } 
      }) : null
    ]);

    // Prepare agent context with existing conversation
    const agentContext = {
      userName: user?.name,
      teamName: teamData?.name,
      funnel: {
        name: funnel?.name,
        description: funnel?.description,
        currentProgress: funnelProgress?.completionPercentage
      },
      milestone: {
        name: milestone?.name,
        description: milestone?.description,
        requiredDataPoints: funnel?.dataPoints.filter(dp => dp.isRequired)
      },
      latestAnalysis: funnelProgress?.analysis[0],
      existingConversation: true
    };

    return {
      conversationId: existingConversation.id,
      agentContext,
      initialPrompt: await generateInitialPrompt(agentContext)
    };
  }

  // If no existing conversation, create a new one
  const [user, funnel, milestone, funnelProgress, teamData] = await Promise.all([
    prisma.user.findUnique({ where: { id: context.userId } }),
    prisma.funnelDefinition.findUnique({ 
      where: { id: context.funnelId },
      include: { milestones: true, dataPoints: true }
    }),
    prisma.funnelMilestone.findUnique({ 
      where: { id: context.milestoneId } 
    }),
    prisma.funnelProgress.findFirst({
      where: {
        funnelId: context.funnelId,
        OR: [
          { userId: context.userId },
          { teamId: context.teamId || '' }
        ]
      },
      include: {
        analysis: {
          orderBy: { timestamp: 'desc' },
          take: 1
        }
      }
    }),
    context.teamId ? prisma.team.findUnique({ 
      where: { id: context.teamId } 
    }) : null
  ]);

  // Create new conversation
  const conversation = await prisma.userConversation.create({
    data: {
      userId: context.userId,
      agentId: context.agentId,
      funnelId: context.funnelId,
      milestoneId: context.milestoneId,
      status: 'active',
      metadata: {
        teamId: context.teamId,
        purpose: 'milestone_completion',
        currentProgress: funnelProgress?.completionPercentage || 0
      }
    }
  });

  // Prepare agent context for new conversation
  const agentContext = {
    userName: user?.name,
    teamName: teamData?.name,
    funnel: {
      name: funnel?.name,
      description: funnel?.description,
      currentProgress: funnelProgress?.completionPercentage
    },
    milestone: {
      name: milestone?.name,
      description: milestone?.description,
      requiredDataPoints: funnel?.dataPoints.filter(dp => dp.isRequired)
    },
    latestAnalysis: funnelProgress?.analysis[0],
    existingConversation: false
  };

  return {
    conversationId: conversation.id,
    agentContext,
    initialPrompt: await generateInitialPrompt(agentContext)
  };
}