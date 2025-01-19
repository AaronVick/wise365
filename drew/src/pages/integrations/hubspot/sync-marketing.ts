/**
 * File: src/pages/api/integrations/hubspot/sync-marketing.ts
 * ---------------------------------------------------------------------
 * Description:
 * API endpoint to fetch and sync marketing data (campaigns, open rates, click-through rates, etc.)
 * from HubSpot. The data is saved in the database and linked to the appropriate user/team.
 *
 * Supporting Files:
 * - src/services/integrations/hubspot/hubspot-marketing-client.ts: Handles API calls to HubSpot marketing endpoints.
 * - src/services/integrations/hubspot/hubspot-sync-service.ts: Orchestrates the syncing of marketing data.
 * - src/utils/logger.ts: Logs API events and errors.
 * - src/lib/prisma.ts: Database interactions.
 * - src/lib/api-utils.ts: Handles API response formatting and errors.
 */

import { NextApiRequest, NextApiResponse } from "next";
import { syncMarketingData } from "../../../../services/integrations/hubspot/hubspot-sync-service";
import { logInfo, logError } from "../../../../utils/logger";
import { formatApiResponse, handleApiError } from "../../../../lib/api-utils";

/**
 * Syncs marketing data from HubSpot and saves it to the database.
 * @param req - The incoming HTTP request.
 * @param res - The outgoing HTTP response.
 * @returns JSON response indicating success or failure.
 */
const syncMarketing = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    return handleApiError(res, new Error("Invalid request method"), "Only POST method is allowed");
  }

  const { integrationId } = req.body;

  if (!integrationId) {
    logError("Missing integration ID for HubSpot marketing sync");
    return handleApiError(res, new Error("Integration ID is required"), "Invalid request body");
  }

  try {
    logInfo("Starting HubSpot marketing data sync", { integrationId });

    // Sync marketing data
    const syncResult = await syncMarketingData(integrationId);

    logInfo("HubSpot marketing data sync completed", { syncResult });

    res.status(200).json(
      formatApiResponse(syncResult, "HubSpot marketing data synced successfully")
    );
  } catch (error) {
    logError("Error syncing HubSpot marketing data", { error });
    handleApiError(res, error, "Failed to sync HubSpot marketing data");
  }
};

export default syncMarketing;
