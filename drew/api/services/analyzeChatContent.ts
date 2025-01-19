// api/services/analyzeChatContent.ts


/**
 * Analyzes chat content to extract relevant information for funnel tracking.
 * 
 * This service works with:
 * - api/services/conversation-intelligence.ts (main orchestrator)
 * - services/updateFunnelProgress.ts (updates progress with findings)
 * - models/ConversationAnalysis (data structure for findings)
 * 
 * @description Uses LLM to analyze conversation content, looking for specific data points,
 * milestone completions, and other relevant information. Structures the findings in a
 * format that can be used to update funnel progress.
 */


import { PrismaClient } from '@prisma/client';
import { UserConversation, ConversationMessage } from '@prisma/client';

interface AnalysisResult {
  isRelevant: boolean;
  extractedData?: {
    dataPoints: Array<{
      key: string;
      value: any;
      confidence: number;
    }>;
    milestoneProgress?: {
      completed: boolean;
      evidence: string;
    };
  };
  findings?: object;
}

export async function analyzeChatContent(
  conversation: UserConversation & {
    messages: ConversationMessage[];
  }
): Promise<AnalysisResult> {
  try {
    // Prepare conversation content for analysis
    const chatContent = conversation.messages
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));

    // Get analysis context
    const analysisContext = await getAnalysisContext(conversation);

    // Analyze with LLM
    const analysis = await analyzeChatWithLLM(chatContent, analysisContext);

    // Structure and validate findings
    return structureFindings(analysis, analysisContext);
  } catch (error) {
    console.error('Error analyzing chat content:', error);
    return { isRelevant: false };
  }
}

async function getAnalysisContext(conversation: UserConversation) {
  const prisma = new PrismaClient();

  // Get funnel and milestone details
  const [funnel, milestone] = await Promise.all([
    prisma.funnelDefinition.findUnique({
      where: { id: conversation.funnelId },
      include: { dataPoints: true }
    }),
    conversation.milestoneId ? 
      prisma.funnelMilestone.findUnique({
        where: { id: conversation.milestoneId }
      }) : null
  ]);

  return {
    funnel,
    milestone,
    requiredDataPoints: funnel?.dataPoints.filter(dp => dp.isRequired) || []
  };
}