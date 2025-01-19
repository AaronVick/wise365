/**
 * File: src/services/integrations/hubspot/hubspot-sync-service.ts
 * ---------------------------------------------------------------------
 * Description:
 * This file orchestrates data synchronization for HubSpot CRM and marketing services.
 * It uses the respective clients to fetch data and logs events in the IntegrationLogs table.
 *
 * Supporting Files:
 * - src/lib/prisma.ts: Database operations.
 * - src/utils/logger.ts: Logs sync events and errors.
 * - src/services/integrations/hubspot/hubspot-crm-client.ts: Fetches CRM data.
 * - src/services/integrations/hubspot/hubspot-marketing-client.ts: Fetches marketing data.
 * - src/services/integrations/hubspot/hubspot-logs-service.ts: Logs sync activity.
 */

import { PrismaClient } from "@prisma/client";
import { logInfo, logError } from "../../../utils/logger";
import { fetchHubSpotCRMData } from "./hubspot-crm-client";
import { fetchHubSpotMarketingData } from "./hubspot-marketing-client";
import { logIntegrationEvent } from "./hubspot-logs-service";

const prisma = new PrismaClient();

/**
 * Syncs CRM data (contacts, deals, companies, and tasks) for the given integration.
 * @param integrationId - The ID of the HubSpot integration configuration.
 */
export const syncCRMData = async (integrationId: string) => {
  logInfo("Starting CRM data sync", { integrationId });

  try {
    const integration = await prisma.integrationConfig.findUnique({
      where: { id: integrationId },
    });

    if (!integration || integration.platform !== "HubSpot") {
      throw new Error("Invalid integration configuration");
    }

    const { authData } = integration;
    if (!authData || !authData.access_token) {
      throw new Error("Authentication data is missing or invalid");
    }

    // Fetch CRM data
    const crmData = await fetchHubSpotCRMData(authData.access_token);

    // Process and save CRM data
    for (const contact of crmData.contacts) {
      await prisma.contact.upsert({
        where: { externalId: contact.id },
        update: {
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          updatedAt: new Date(),
        },
        create: {
          externalId: contact.id,
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          integrationId,
        },
      });
    }

    logIntegrationEvent(integrationId, "sync", "CRM data sync completed");
    logInfo("CRM data sync completed successfully", { integrationId });
  } catch (error) {
    logError("Failed to sync CRM data", { error });
    logIntegrationEvent(integrationId, "error", "Failed to sync CRM data", {
      error: error.message,
    });
    throw new Error("CRM data sync failed");
  }
};

/**
 * Syncs marketing data (campaigns, performance metrics) for the given integration.
 * @param integrationId - The ID of the HubSpot integration configuration.
 */
export const syncMarketingData = async (integrationId: string) => {
  logInfo("Starting marketing data sync", { integrationId });

  try {
    const integration = await prisma.integrationConfig.findUnique({
      where: { id: integrationId },
    });

    if (!integration || integration.platform !== "HubSpot") {
      throw new Error("Invalid integration configuration");
    }

    const { authData } = integration;
    if (!authData || !authData.access_token) {
      throw new Error("Authentication data is missing or invalid");
    }

    // Fetch marketing data
    const marketingData = await fetchHubSpotMarketingData(authData.access_token);

    // Process and save marketing data
    for (const campaign of marketingData.campaigns) {
      await prisma.marketingCampaign.upsert({
        where: { externalId: campaign.id },
        update: {
          name: campaign.name,
          subject: campaign.subject,
          openRate: campaign.openRate,
          clickRate: campaign.clickRate,
          updatedAt: new Date(),
        },
        create: {
          externalId: campaign.id,
          name: campaign.name,
          subject: campaign.subject,
          openRate: campaign.openRate,
          clickRate: campaign.clickRate,
          integrationId,
        },
      });
    }

    logIntegrationEvent(integrationId, "sync", "Marketing data sync completed");
    logInfo("Marketing data sync completed successfully", { integrationId });
  } catch (error) {
    logError("Failed to sync marketing data", { error });
    logIntegrationEvent(integrationId, "error", "Failed to sync marketing data", {
      error: error.message,
    });
    throw new Error("Marketing data sync failed");
  }
};

/**
 * Orchestrates both CRM and marketing data synchronization for the integration.
 * @param integrationId - The ID of the HubSpot integration configuration.
 */
export const syncHubSpotData = async (integrationId: string) => {
  logInfo("Starting full HubSpot data sync", { integrationId });

  try {
    await syncCRMData(integrationId);
    await syncMarketingData(integrationId);

    logInfo("Full HubSpot data sync completed successfully", { integrationId });
  } catch (error) {
    logError("Failed to complete full HubSpot data sync", { error });
    throw new Error("Full HubSpot data sync failed");
  }
};
