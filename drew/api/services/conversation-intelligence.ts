// api/services/conversation-intelligence.ts

/**
 * Analyzes conversations to extract relevant data for funnel progress tracking.
 * 
 * This service works with:
 * - services/analyzeChatContent.ts (for actual content analysis)
 * - services/updateFunnelProgress.ts (for updating progress based on findings)
 * - models/ConversationAnalysis (Prisma model for storing analysis results)
 * 
 * @description Processes conversation content to find relevant information about 
 * milestone completion and data points. Prevents duplicate analysis within 5 minutes 
 * and updates funnel progress when relevant data is found. Used by the background 
 * processing system to continuously analyze ongoing conversations.
 * 
 * @requires analyzeChatContent and updateFunnelProgress functions to be implemented separately
 */

interface ConversationAnalysisResult {
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
}

export async function analyzeConversation(
  conversationId: string
): Promise<ConversationAnalysisResult> {
  const prisma = new PrismaClient();

  // Get conversation with context
  const conversation = await prisma.userConversation.findUnique({
    where: { id: conversationId },
    include: {
      messages: true,
      user: true,
      analysis: {
        orderBy: { analyzedAt: 'desc' },
        take: 1
      }
    }
  });

  // Skip if already analyzed
  if (conversation?.analysis?.length) {
    const lastAnalysis = conversation.analysis[0];
    const timeSinceAnalysis = Date.now() - lastAnalysis.analyzedAt.getTime();
    if (timeSinceAnalysis < 5 * 60 * 1000) { // 5 minutes
      return null;
    }
  }

  // Analyze conversation content
  const analysisResult = await analyzeChatContent(conversation);

  // Store analysis results
  if (analysisResult.isRelevant) {
    await prisma.conversationAnalysis.create({
      data: {
        conversationId,
        serviceType: 'funnel_intelligence',
        isRelevant: true,
        findings: analysisResult,
        extractedData: analysisResult.extractedData,
      }
    });

    // If relevant data found, update funnel progress
    if (analysisResult.extractedData) {
      await updateFunnelProgress(
        conversation.userId,
        conversation.funnelId,
        analysisResult.extractedData
      );
    }
  }

  return analysisResult;
}