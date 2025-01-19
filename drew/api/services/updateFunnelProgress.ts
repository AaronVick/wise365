// services/updateFunnelProgress.ts


/**
 * Updates funnel progress based on conversation analysis findings.
 * 
 * This service works with:
 * - api/services/conversation-intelligence.ts (calls this service)
 * - services/analyzeChatContent.ts (provides data to update)
 * - models/ConversationAnalysis (structure of analysis data)
 * 
 * @description Takes the analyzed conversation data and updates various aspects
 * of funnel progress including milestone completion, data point collection,
 * and overall completion percentage.
 */


export async function updateFunnelProgress(
  userId: string,
  funnelId: string,
  extractedData: {
    dataPoints: Array<{
      key: string;
      value: any;
      confidence: number;
    }>;
    milestoneProgress?: {
      completed: boolean;
      evidence: string;
    };
  }
): Promise<void> {
  const prisma = new PrismaClient();

  // Start a transaction
  await prisma.$transaction(async (tx) => {
    // Update data points
    for (const dataPoint of extractedData.dataPoints) {
      await tx.dataPointCollection.upsert({
        where: {
          unique_data_point: {
            userId,
            funnelId,
            key: dataPoint.key
          }
        },
        update: {
          value: dataPoint.value,
          confidence: dataPoint.confidence,
          lastUpdated: new Date()
        },
        create: {
          userId,
          funnelId,
          key: dataPoint.key,
          value: dataPoint.value,
          confidence: dataPoint.confidence
        }
      });
    }

    // Update milestone if completed
    if (extractedData.milestoneProgress?.completed) {
      await tx.milestoneProgress.update({
        where: {
          userId_funnelId: {
            userId,
            funnelId
          }
        },
        data: {
          status: 'completed',
          completedAt: new Date(),
          evidence: extractedData.milestoneProgress.evidence
        }
      });
    }

    // Recalculate overall progress
    await updateOverallProgress(tx, userId, funnelId);
  });
}