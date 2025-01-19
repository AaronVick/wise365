/**
 * File: src/services/integrations/hubspot/hubspot-connection-service.ts
 * ---------------------------------------------------------------------
 * Description:
 * This file handles managing and validating HubSpot integration configurations.
 * It includes methods for connecting, disconnecting, and validating token statuses.
 * Updates are stored in the IntegrationConfig table.
 *
 * Supporting Files:
 * - src/lib/prisma.ts: Database operations.
 * - src/utils/logger.ts: Logs integration events.
 * - src/services/integrations/hubspot/hubspot-auth.ts: Manages token handling.
 */

import { PrismaClient } from "@prisma/client";
import { logInfo, logError } from "../../../utils/logger";
import { refreshHubSpotToken } from "./hubspot-auth";

const prisma = new PrismaClient();

/**
 * Connect to HubSpot integration by storing tokens and user configuration.
 * @param userId - The ID of the user initiating the connection.
 * @param teamId - The team ID if the integration is team-wide.
 * @param authData - Authentication data from HubSpot OAuth.
 * @returns The created or updated IntegrationConfig record.
 */
export const connectHubSpotIntegration = async (
  userId: string,
  teamId: string | null,
  authData: any
) => {
  logInfo("Connecting HubSpot integration", { userId, teamId });

  try {
    const integration = await prisma.integrationConfig.upsert({
      where: {
        userId_teamId_platform: {
          userId,
          teamId,
          platform: "HubSpot",
        },
      },
      update: {
        authData,
        status: "enabled",
        updatedAt: new Date(),
      },
      create: {
        userId,
        teamId,
        platform: "HubSpot",
        status: "enabled",
        authData,
      },
    });

    logInfo("HubSpot integration connected successfully", { integrationId: integration.id });
    return integration;
  } catch (error) {
    logError("Failed to connect HubSpot integration", { error });
    throw new Error("Could not connect HubSpot integration.");
  }
};

/**
 * Disconnect the HubSpot integration by disabling the configuration.
 * @param integrationId - The ID of the integration configuration to disable.
 * @returns The updated IntegrationConfig record.
 */
export const disconnectHubSpotIntegration = async (integrationId: string) => {
  logInfo("Disconnecting HubSpot integration", { integrationId });

  try {
    const integration = await prisma.integrationConfig.update({
      where: { id: integrationId },
      data: { status: "disabled", updatedAt: new Date() },
    });

    logInfo("HubSpot integration disconnected successfully", { integrationId });
    return integration;
  } catch (error) {
    logError("Failed to disconnect HubSpot integration", { error });
    throw new Error("Could not disconnect HubSpot integration.");
  }
};

/**
 * Validate the token status of a HubSpot integration.
 * If the token is expired, attempts to refresh it.
 * @param integrationId - The ID of the integration configuration to validate.
 * @returns The updated IntegrationConfig record with refreshed tokens if applicable.
 */
export const validateHubSpotToken = async (integrationId: string) => {
  logInfo("Validating HubSpot token", { integrationId });

  try {
    const integration = await prisma.integrationConfig.findUnique({
      where: { id: integrationId },
    });

    if (!integration) {
      throw new Error("Integration not found");
    }

    const { authData } = integration;
    if (!authData || !authData.refresh_token) {
      throw new Error("Invalid authentication data");
    }

    const isTokenValid = /* Logic to check token validity */;
    if (!isTokenValid) {
      logInfo("Refreshing HubSpot token", { integrationId });
      const refreshedTokens = await refreshHubSpotToken(authData.refresh_token);

      const updatedIntegration = await prisma.integrationConfig.update({
        where: { id: integrationId },
        data: {
          authData: {
            ...authData,
            access_token: refreshedTokens.access_token,
            expires_in: refreshedTokens.expires_in,
            refreshed_at: new Date(),
          },
          updatedAt: new Date(),
        },
      });

      logInfo("HubSpot token refreshed successfully", { integrationId });
      return updatedIntegration;
    }

    logInfo("HubSpot token is valid", { integrationId });
    return integration;
  } catch (error) {
    logError("Failed to validate HubSpot token", { error });
    throw new Error("Could not validate HubSpot token.");
  }
};
