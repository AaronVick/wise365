// services/conversation-analyzer.ts


/**
 * Service for preparing conversation data for analysis and handling analysis results
 * 
 * This service:
 * 1. Gathers conversation data and relevant context
 * 2. Prepares data structures for external analysis
 * 3. Handles and stores analysis results
 * 4. Updates related funnel progress based on findings
 * 
 * Works with:
 * - models/UserConversation
 * - models/ConversationAnalysis
 * - models/FunnelProgress
 */


import { prisma } from '@/lib/prisma';
import type { ConversationMessage, FunnelProgress, UserConversation } from '@prisma/client';

interface AnalysisContext {
  conversationId: string;
  messages: ConversationMessage[];
  funnelId?: string;
  milestoneId?: string;
  currentProgress?: FunnelProgress;
  requiredDataPoints?: Array<{
    id: string;
    name: string;
    dataType: string;
  }>;
}

interface AnalysisResult {
  isRelevant: boolean;
  findings?: Record<string, any>;
  extractedData?: {
    dataPoints?: Array<{
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

export async function prepareConversationForAnalysis(
  conversationId: string
): Promise<AnalysisContext> {
  // Get conversation with messages and related data
  const conversation = await prisma.userConversation.findUnique({
    where: { id: conversationId },
    include: {
      messages: {
        orderBy: { timestamp: 'asc' }
      },
      user: true
    }
  });

  if (!conversation) {
    throw new Error('Conversation not found');
  }

  // Get current funnel progress if applicable
  let currentProgress = null;
  let requiredDataPoints = null;
  
  if (conversation.funnelId) {
    [currentProgress, requiredDataPoints] = await Promise.all([
      prisma.funnelProgress.findFirst({
        where: {
          funnelId: conversation.funnelId,
          userId: conversation.userId
        },
        include: {
          milestones: true,
          dataPoints: true
        }
      }),
      prisma.funnelDataPoint.findMany({
        where: {
          funnelId: conversation.funnelId,
          isRequired: true
        },
        select: {
          id: true,
          name: true,
          dataType: true
        }
      })
    ]);
  }

  return {
    conversationId,
    messages: conversation.messages,
    funnelId: conversation.funnelId,
    milestoneId: conversation.milestoneId,
    currentProgress,
    requiredDataPoints
  };
}

export async function storeAnalysisResults(
  conversationId: string,
  results: AnalysisResult
): Promise<void> {
  // Start a transaction to update all related records
  await prisma.$transaction(async (tx) => {
    // 1. Create analysis record
    const analysis = await tx.conversationAnalysis.create({
      data: {
        conversationId,
        serviceType: 'funnel_intelligence',
        isRelevant: results.isRelevant,
        findings: results.findings || {},
        extractedData: results.extractedData || {},
        analyzedAt: new Date()
      }
    });

    // If not relevant, stop here
    if (!results.isRelevant || !results.extractedData) {
      return;
    }

    // 2. Get conversation to check funnel context
    const conversation = await tx.userConversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation?.funnelId) {
      return;
    }

    // 3. Update data points if any were extracted
    if (results.extractedData.dataPoints?.length) {
      await Promise.all(
        results.extractedData.dataPoints.map(point => 
          tx.dataPointCollection.create({
            data: {
              progressId: conversation.funnelId,
              dataPointId: point.key,
              value: point.value,
              source: 'conversation_analysis',
              confidence: point.confidence,
              isValidated: point.confidence > 0.8,
              collectedAt: new Date()
            }
          })
        )
      );
    }

    // 4. Update milestone progress if completion detected
    if (
      results.extractedData.milestoneProgress?.completed &&
      conversation.milestoneId
    ) {
      await tx.milestoneProgress.upsert({
        where: {
          progressId_milestoneId: {
            progressId: conversation.funnelId,
            milestoneId: conversation.milestoneId
          }
        },
        create: {
          progressId: conversation.funnelId,
          milestoneId: conversation.milestoneId,
          status: 'completed',
          completedAt: new Date(),
          validationResults: {
            evidence: results.extractedData.milestoneProgress.evidence,
            analysisId: analysis.id
          }
        },
        update: {
          status: 'completed',
          completedAt: new Date(),
          validationResults: {
            evidence: results.extractedData.milestoneProgress.evidence,
            analysisId: analysis.id
          }
        }
      });
    }
  });
}

export async function getRecentAnalysis(
  conversationId: string
): Promise<AnalysisResult | null> {
  const recentAnalysis = await prisma.conversationAnalysis.findFirst({
    where: { 
      conversationId,
      analyzedAt: {
        gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
      }
    },
    orderBy: { analyzedAt: 'desc' }
  });

  if (!recentAnalysis) {
    return null;
  }

  return {
    isRelevant: recentAnalysis.isRelevant,
    findings: recentAnalysis.findings as Record<string, any>,
    extractedData: recentAnalysis.extractedData as {
      dataPoints?: Array<{
        key: string;
        value: any;
        confidence: number;
      }>;
      milestoneProgress?: {
        completed: boolean;
        evidence: string;
      };
    }
  };
}