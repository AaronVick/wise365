// File: src/services/integrations/hubspot/hubspot-marketing-analysis.ts
/**
 * HubSpot Marketing Analysis
 * ---------------------------
 * Description:
 * This file analyzes HubSpot Marketing data using LLMs, leveraging Not Diamond for intelligent routing
 * to the best-performing model. Insights include campaign performance, content effectiveness, and recommendations.
 *
 * Supporting Files:
 * - src/lib/llm/llm-handler.ts: Interacts with LLMs for analysis.
 * - src/services/routing/implementations/not-diamond.service.ts: Routes tasks to optimal LLMs.
 * - src/services/team/highlight-generator.ts: Generates actionable insights for teams.
 * - src/lib/prisma.ts: Handles database operations.
 * - src/utils/logger.ts: Logs operations and errors.
 */

import { PrismaClient } from "@prisma/client";
import { NotDiamondService } from "../../routing/implementations/not-diamond.service";
import { logInfo, logError } from "../../../utils/logger";
import { LLMHandler } from "../../../lib/llm/llm-handler";

const prisma = new PrismaClient();
const notDiamondService = new NotDiamondService();

/**
 * Analyze marketing data and provide insights.
 * @param integrationId - The ID of the HubSpot integration.
 * @param marketingData - Campaign data fetched from HubSpot.
 * @returns Analysis results and recommendations.
 */
export const analyzeMarketingData = async (integrationId: string, marketingData: any) => {
  logInfo("Starting marketing data analysis", { integrationId });

  try {
    // Step 1: Route the task to the appropriate LLM
    const routingConfig = await notDiamondService.routeTask({
      taskType: "marketingAnalysis",
      content: marketingData,
    });

    logInfo("Routing configuration received", { routingConfig });

    // Step 2: Send marketing data to the selected LLM
    const llmResponse = await LLMHandler.handleRequest({
      model: routingConfig.model,
      provider: routingConfig.provider,
      prompt: `Analyze the following marketing data and provide insights:\n${JSON.stringify(marketingData)}`,
    });

    logInfo("LLM response received", { integrationId, llmResponse });

    // Step 3: Parse LLM response for actionable insights
    const insights = {
      findings: llmResponse.findings || [],
      recommendations: llmResponse.recommendations || [],
    };

    // Step 4: Save analysis results to the database
    const analysis = await prisma.integrationAnalysis.create({
      data: {
        integrationId,
        backendService: routingConfig.provider,
        analysisType: "marketingAnalysis",
        findings: insights.findings,
        recommendations: insights.recommendations,
        analyzedAt: new Date(),
      },
    });

    logInfo("Marketing analysis saved to database", { analysisId: analysis.id });

    return analysis;
  } catch (error) {
    logError("Error during marketing data analysis", { integrationId, error });
    throw new Error("Failed to analyze marketing data.");
  }
};
