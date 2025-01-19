/**
 * File: src/pages/api/integrations/hubspot/connect.ts
 * ---------------------------------------------------------------------
 * Description:
 * API endpoint to initiate the OAuth flow for HubSpot integration. 
 * Redirects the user to HubSpot's authorization page to connect their account.
 *
 * Supporting Files:
 * - src/services/integrations/hubspot/hubspot-auth.ts: Handles the OAuth flow.
 * - src/utils/logger.ts: Logs API events and errors.
 * - src/lib/api-utils.ts: Handles API response formatting and errors.
 */

import { NextApiRequest, NextApiResponse } from "next";
import { getAuthorizationUrl } from "../../../../services/integrations/hubspot/hubspot-auth";
import { logInfo, logError } from "../../../../utils/logger";
import { formatApiResponse, handleApiError } from "../../../../lib/api-utils";

const HUBSPOT_OAUTH_REDIRECT = process.env.HUBSPOT_OAUTH_REDIRECT || "https://your-app-url/api/integrations/hubspot/callback";

/**
 * Initiates the OAuth flow for HubSpot.
 * @param req - The incoming HTTP request.
 * @param res - The outgoing HTTP response.
 * @returns A redirection URL to HubSpot's OAuth page.
 */
const connectHubSpot = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    logInfo("Starting HubSpot OAuth flow");

    // Generate the HubSpot OAuth URL
    const authUrl = getAuthorizationUrl(HUBSPOT_OAUTH_REDIRECT);

    logInfo("Generated HubSpot OAuth URL", { authUrl });

    // Redirect user to HubSpot's OAuth page
    res.redirect(authUrl);
  } catch (error) {
    logError("Failed to initiate HubSpot OAuth flow", { error });
    handleApiError(res, error, "Failed to initiate HubSpot OAuth flow");
  }
};

export default connectHubSpot;
