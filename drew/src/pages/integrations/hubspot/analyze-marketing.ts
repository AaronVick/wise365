/**
 * File: src/pages/api/integrations/hubspot/analyze-marketing.ts
 * ---------------------------------------------------------------------
 * Description:
 * API endpoint to trigger an LLM-based analysis of marketing data from HubSpot.
 * Leverages stored campaign data to analyze trends, performance, and optimization opportunities.
 *
 * Supporting Files:
 * - src/services/integrations/hubspot/hubspot-marketing-analysis.ts: Performs LLM-based marketing data analysis.
 * - src/services/routing/implementations/not-diamond.service.ts: Determines the optimal LLM provider.
 * - src/utils/logger.ts: Logs analysis events and errors.
 * - src/lib/api-utils.ts: Handles API response formatting and errors.
 * - src/lib/prisma.ts: Database interactions.
 */

import { NextApiRequest, NextApiResponse } from "next";
import { analyzeMarketingData } from "../../../../services/integrations/hubspot/hubspot-marketing-analysis";
import { logInfo, logError } from "../../../../utils/logger";
import { formatApiResponse, handleApiError } from "../../../../lib/api-utils";

/**
 * Triggers LLM-based analysis of marketing data and returns insights.
 * @param req - The incoming HTTP request.
 * @param res - The outgoing HTTP response.
 * @returns JSON response with analysis results or an error message.
 */
const analyzeMarketing = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    return handleApiError(res, new Error("Invalid request method"), "Only POST method is allowed");
  }

  const { integrationId } = req.body;

  if (!integrationId) {
    logError("Missing integration ID for marketing analysis");
    return handleApiError(res, new Error("Integration ID is required"), "Invalid request body");
  }

  try {
    logInfo("Starting HubSpot marketing data analysis", { integrationId });

    // Perform marketing data analysis
    const analysisResults = await analyzeMarketingData(integrationId);

    logInfo("HubSpot marketing data analysis completed", { analysisResults });

    res.status(200).json(
      formatApiResponse(analysisResults, "Marketing data analysis completed successfully")
    );
  } catch (error) {
    logError("Error analyzing HubSpot marketing data", { error });
    handleApiError(res, error, "Failed to analyze marketing data");
  }
};

export default analyzeMarketing;
