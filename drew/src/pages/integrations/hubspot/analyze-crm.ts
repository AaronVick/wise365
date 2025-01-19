/**
 * File: src/pages/api/integrations/hubspot/analyze-crm.ts
 * ---------------------------------------------------------------------
 * Description:
 * API endpoint to trigger an LLM-based analysis of CRM data from HubSpot.
 * Uses data stored in the database to identify trends, opportunities, and bottlenecks.
 *
 * Supporting Files:
 * - src/services/integrations/hubspot/hubspot-crm-analysis.ts: Performs LLM-based CRM data analysis.
 * - src/services/routing/implementations/not-diamond.service.ts: Determines the optimal LLM provider.
 * - src/utils/logger.ts: Logs analysis events and errors.
 * - src/lib/api-utils.ts: Handles API response formatting and errors.
 * - src/lib/prisma.ts: Database interactions.
 */

import { NextApiRequest, NextApiResponse } from "next";
import { analyzeCRMData } from "../../../../services/integrations/hubspot/hubspot-crm-analysis";
import { logInfo, logError } from "../../../../utils/logger";
import { formatApiResponse, handleApiError } from "../../../../lib/api-utils";

/**
 * Triggers LLM-based analysis of CRM data and returns insights.
 * @param req - The incoming HTTP request.
 * @param res - The outgoing HTTP response.
 * @returns JSON response with analysis results or an error message.
 */
const analyzeCRM = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    return handleApiError(res, new Error("Invalid request method"), "Only POST method is allowed");
  }

  const { integrationId } = req.body;

  if (!integrationId) {
    logError("Missing integration ID for CRM analysis");
    return handleApiError(res, new Error("Integration ID is required"), "Invalid request body");
  }

  try {
    logInfo("Starting HubSpot CRM data analysis", { integrationId });

    // Perform CRM data analysis
    const analysisResults = await analyzeCRMData(integrationId);

    logInfo("HubSpot CRM data analysis completed", { analysisResults });

    res.status(200).json(
      formatApiResponse(analysisResults, "CRM data analysis completed successfully")
    );
  } catch (error) {
    logError("Error analyzing HubSpot CRM data", { error });
    handleApiError(res, error, "Failed to analyze CRM data");
  }
};

export default analyzeCRM;
