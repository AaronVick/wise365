/**
 * File: src/pages/api/integrations/hubspot/sync-crm.ts
 * ---------------------------------------------------------------------
 * Description:
 * API endpoint to fetch and sync CRM data (contacts, deals, companies, and tasks) 
 * from HubSpot. The data is saved in the database and linked to the appropriate user/team.
 *
 * Supporting Files:
 * - src/services/integrations/hubspot/hubspot-crm-client.ts: Handles API calls to HubSpot CRM endpoints.
 * - src/services/integrations/hubspot/hubspot-sync-service.ts: Orchestrates the syncing of CRM data.
 * - src/utils/logger.ts: Logs API events and errors.
 * - src/lib/prisma.ts: Database interactions.
 * - src/lib/api-utils.ts: Handles API response formatting and errors.
 */

import { NextApiRequest, NextApiResponse } from "next";
import { syncCRMData } from "../../../../services/integrations/hubspot/hubspot-sync-service";
import { logInfo, logError } from "../../../../utils/logger";
import { formatApiResponse, handleApiError } from "../../../../lib/api-utils";

/**
 * Syncs CRM data from HubSpot and saves it to the database.
 * @param req - The incoming HTTP request.
 * @param res - The outgoing HTTP response.
 * @returns JSON response indicating success or failure.
 */
const syncCRM = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    return handleApiError(res, new Error("Invalid request method"), "Only POST method is allowed");
  }

  const { integrationId } = req.body;

  if (!integrationId) {
    logError("Missing integration ID for HubSpot CRM sync");
    return handleApiError(res, new Error("Integration ID is required"), "Invalid request body");
  }

  try {
    logInfo("Starting HubSpot CRM data sync", { integrationId });

    // Sync CRM data
    const syncResult = await syncCRMData(integrationId);

    logInfo("HubSpot CRM data sync completed", { syncResult });

    res.status(200).json(
      formatApiResponse(syncResult, "HubSpot CRM data synced successfully")
    );
  } catch (error) {
    logError("Error syncing HubSpot CRM data", { error });
    handleApiError(res, error, "Failed to sync HubSpot CRM data");
  }
};

export default syncCRM;
