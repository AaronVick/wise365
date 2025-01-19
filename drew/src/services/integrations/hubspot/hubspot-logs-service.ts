/**
 * File: src/services/integrations/hubspot/hubspot-logs-service.ts
 * ---------------------------------------------------------------------
 * Description:
 * Provides functions to log integration events and retrieve logs from the IntegrationLogs table.
 * Enables monitoring of sync processes, error events, and general integration activity.
 *
 * Supporting Files:
 * - src/lib/prisma.ts: Handles database interactions.
 * - src/utils/logger.ts: Logs actions and errors to the system.
 */

import { PrismaClient } from "@prisma/client";
import { logInfo, logError } from "../../../utils/logger";

const prisma = new PrismaClient();

/**
 * Logs an event for a specific integration in the IntegrationLogs table.
 * @param integrationId - The ID of the integration associated with the log entry.
 * @param eventType - The type of event (e.g., "sync", "error", "fetch").
 * @param description - A brief description of the event.
 * @param details - Additional metadata or details about the event (optional).
 */
export const logIntegrationEvent = async (
  integrationId: string,
  eventType: string,
  description: string,
  details?: Record<string, any>
) => {
  try {
    logInfo("Logging integration event", { integrationId, eventType, description });

    await prisma.integrationLogs.create({
      data: {
        integrationId,
        eventType,
        description,
        details: details || {},
      },
    });

    logInfo("Integration event logged successfully", { integrationId, eventType });
  } catch (error) {
    logError("Failed to log integration event", { error, integrationId, eventType });
    throw new Error("Logging integration event failed");
  }
};

/**
 * Fetches the latest logs for a given integration.
 * @param integrationId - The ID of the integration to fetch logs for.
 * @param limit - The number of logs to fetch (default: 10).
 * @returns A list of log entries sorted by timestamp (most recent first).
 */
export const getIntegrationLogs = async (
  integrationId: string,
  limit: number = 10
) => {
  try {
    logInfo("Fetching integration logs", { integrationId, limit });

    const logs = await prisma.integrationLogs.findMany({
      where: { integrationId },
      orderBy: { timestamp: "desc" },
      take: limit,
    });

    logInfo("Integration logs fetched successfully", { integrationId, count: logs.length });
    return logs;
  } catch (error) {
    logError("Failed to fetch integration logs", { error, integrationId });
    throw new Error("Fetching integration logs failed");
  }
};

/**
 * Formats logs for API responses.
 * @param logs - The raw logs from the database.
 * @returns A formatted list of logs for client consumption.
 */
export const formatIntegrationLogs = (logs: any[]) => {
  return logs.map((log) => ({
    id: log.id,
    eventType: log.eventType,
    description: log.description,
    details: log.details,
    timestamp: log.timestamp,
  }));
};
