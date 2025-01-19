/**
 * File: src/pages/api/integrations/hubspot/callback.ts
 * ---------------------------------------------------------------------
 * Description:
 * API endpoint to handle the OAuth callback from HubSpot. 
 * Exchanges the authorization code for tokens and saves them in the database.
 *
 * Supporting Files:
 * - src/services/integrations/hubspot/hubspot-auth.ts: Handles token exchange and saving.
 * - src/lib/prisma.ts: Database interactions for saving tokens.
 * - src/utils/logger.ts: Logs API events and errors.
 * - src/lib/api-utils.ts: Handles API response formatting and errors.
 */

import { NextApiRequest, NextApiResponse } from "next";
import { exchangeAuthorizationCode, saveTokens } from "../../../../services/integrations/hubspot/hubspot-auth";
import { logInfo, logError } from "../../../../utils/logger";
import { formatApiResponse, handleApiError } from "../../../../lib/api-utils";

/**
 * Handles the OAuth callback from HubSpot.
 * @param req - The incoming HTTP request.
 * @param res - The outgoing HTTP response.
 * @returns JSON response indicating success or failure.
 */
const hubspotCallback = async (req: NextApiRequest, res: NextApiResponse) => {
  const { code, state } = req.query;

  if (!code) {
    logError("Missing authorization code in HubSpot callback");
    return handleApiError(res, new Error("Authorization code is required"), "Invalid callback request");
  }

  try {
    logInfo("Received HubSpot OAuth callback", { code, state });

    // Exchange authorization code for tokens
    const tokens = await exchangeAuthorizationCode(code as string);

    logInfo("Successfully exchanged authorization code for tokens", { tokens });

    // Save tokens in the database
    await saveTokens(tokens, state as string);

    logInfo("Successfully saved HubSpot tokens");

    // Redirect to success page or return a success response
    res.redirect("/integrations/hubspot/success");
  } catch (error) {
    logError("Error handling HubSpot OAuth callback", { error });
    handleApiError(res, error, "Failed to complete HubSpot OAuth process");
  }
};

export default hubspotCallback;
