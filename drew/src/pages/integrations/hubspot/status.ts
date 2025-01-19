/**
 * File: src/pages/api/integrations/hubspot/status.ts
 * ---------------------------------------------------------------------
 * Description:
 * API endpoint to retrieve the current connection and sync status of a HubSpot integration.
 * Queries the IntegrationConfig table for connection status and recent sync history.
 *
 * Supporting Files:
 * - src/services/integrations/hubspot/hubspot-connection-service.ts: Handles status retrieval and token validation.
 * - src/services/integrations/hubspot/hubspot-logs-service.ts: Fetches recent sync logs.
 * - src/utils/logger.ts: Logs API events and errors.
 * - src/lib/api-utils.ts: Handles API response formatting and errors.
 * - src/lib/prisma.ts: Database interactions.
 */

import { NextApiRequest, NextApiResponse } from "next";
import { getConnectionStatus } from "../../../../services/integrations/hubspot/hubspot-connection-service";
import { getRecentLogs } from "../../../../services/integrations/hubspot/hubspot-logs-service";
import { logInfo, logError } from "../../../../utils/logger";
import { formatApiResponse, handleApiError } from "../../../../lib/api-utils";

/**
 * Retrieves the current connection and sync status for a HubSpot integration.
 * @param req - The incoming HTTP request.
 * @param res - The outgoing HTTP response.
 * @returns JSON response with connection and sync status or an error message.
 */
const getStatus = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "GET") {
    return handleApiError(res, new Error("Invalid request method"), "Only GET method is allowed");
  }

  const { integrationId } = req.query;

  if (!integrationId || typeof integrationId !== "string") {
    logError("Missing or invalid integration ID for status check");
    return handleApiError(res, new Error("Integration ID is required"), "Invalid request query");
  }

  try {
    logInfo("Fetching connection and sync status for HubSpot integration", { integrationId });

    // Fetch connection status
    const connectionStatus = await getConnectionStatus(integrationId);

    // Fetch recent sync logs
    const syncLogs = await getRecentLogs(integrationId);

    const response = {
      connectionStatus,
      syncLogs,
    };

    logInfo("Successfully retrieved HubSpot integration status", { response });

    res.status(200).json(formatApiResponse(response, "Integration status retrieved successfully"));
  } catch (error) {
    logError("Error retrieving HubSpot integration status", { error });
    handleApiError(res, error, "Failed to retrieve integration status");
  }
};

export default getStatus;
