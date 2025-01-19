/**
 * File: src/pages/api/integrations/hubspot/logs.ts
 * ---------------------------------------------------------------------
 * Description:
 * API endpoint to fetch recent logs for a HubSpot integration.
 * Queries the IntegrationLogs table and provides a paginated response for debugging and analysis.
 *
 * Supporting Files:
 * - src/services/integrations/hubspot/hubspot-logs-service.ts: Handles log retrieval from the database.
 * - src/utils/logger.ts: Logs API events and errors.
 * - src/lib/api-utils.ts: Handles API response formatting and error handling.
 * - src/lib/prisma.ts: Database interactions.
 */

import { NextApiRequest, NextApiResponse } from "next";
import { getLogs } from "../../../../services/integrations/hubspot/hubspot-logs-service";
import { logInfo, logError } from "../../../../utils/logger";
import { formatApiResponse, handleApiError } from "../../../../lib/api-utils";

/**
 * Fetches recent logs for a specified HubSpot integration.
 * Supports pagination through `page` and `pageSize` query parameters.
 * @param req - The incoming HTTP request.
 * @param res - The outgoing HTTP response.
 * @returns JSON response with log entries or an error message.
 */
const getLogsHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "GET") {
    return handleApiError(res, new Error("Invalid request method"), "Only GET method is allowed");
  }

  const { integrationId, page = "1", pageSize = "10" } = req.query;

  if (!integrationId || typeof integrationId !== "string") {
    logError("Missing or invalid integration ID for log retrieval");
    return handleApiError(res, new Error("Integration ID is required"), "Invalid request query");
  }

  const pageNumber = parseInt(page as string, 10);
  const pageSizeNumber = parseInt(pageSize as string, 10);

  if (isNaN(pageNumber) || isNaN(pageSizeNumber) || pageNumber <= 0 || pageSizeNumber <= 0) {
    logError("Invalid pagination parameters", { page, pageSize });
    return handleApiError(res, new Error("Invalid pagination parameters"), "Page and pageSize must be positive integers");
  }

  try {
    logInfo("Fetching logs for HubSpot integration", { integrationId, page: pageNumber, pageSize: pageSizeNumber });

    // Fetch logs from the service
    const logs = await getLogs(integrationId, pageNumber, pageSizeNumber);

    logInfo("Successfully retrieved logs for HubSpot integration", { logs });

    res.status(200).json(formatApiResponse(logs, "Logs retrieved successfully"));
  } catch (error) {
    logError("Error fetching logs for HubSpot integration", { error });
    handleApiError(res, error, "Failed to retrieve logs");
  }
};

export default getLogsHandler;
