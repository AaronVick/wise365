/**
 * File: src/services/integrations/hubspot/hubspot-crm-client.ts
 *
 * Description:
 * Handles interaction with HubSpot's CRM APIs for syncing contacts, deals, companies, and tasks.
 * 
 * Supporting Files:
 * - src/utils/logger.ts: Logs API events and errors.
 * - src/lib/prisma.ts: For database operations to save CRM data.
 * - src/services/integrations/hubspot/hubspot-auth.ts: Manages token refresh for authenticated API calls.
 * 
 * Dependencies:
 * - Axios: For making HTTP requests to HubSpot API endpoints.
 * - PrismaClient: For saving data to the database.
 */

import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { logInfo, logError } from '@/utils/logger';
import { refreshHubSpotToken } from './hubspot-auth';

// Initialize Prisma Client
const prisma = new PrismaClient();

// HubSpot API Base URL
const HUBSPOT_API_BASE = 'https://api.hubapi.com';

/**
 * Fetches and syncs HubSpot contacts to the database.
 * @param integrationId - The ID of the integration record.
 */
export const syncHubSpotContacts = async (integrationId: string) => {
  try {
    // Fetch access token from the database
    const integration = await prisma.integrationConfig.findUnique({
      where: { id: integrationId },
    });

    if (!integration || !integration.authData?.accessToken) {
      throw new Error('Integration or access token not found');
    }

    // Refresh token if necessary
    if (new Date(integration.authData.expiresAt) <= new Date()) {
      await refreshHubSpotToken(integrationId);
    }

    const { accessToken } = integration.authData;

    // Fetch contacts from HubSpot
    const response = await axios.get(`${HUBSPOT_API_BASE}/crm/v3/objects/contacts`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { limit: 100, properties: 'firstname,lastname,email' },
    });

    const contacts = response.data.results;

    // Save contacts to the database
    for (const contact of contacts) {
      await prisma.contact.upsert({
        where: { externalId: contact.id },
        update: {
          firstName: contact.properties.firstname,
          lastName: contact.properties.lastname,
          email: contact.properties.email,
        },
        create: {
          externalId: contact.id,
          firstName: contact.properties.firstname,
          lastName: contact.properties.lastname,
          email: contact.properties.email,
          integrationId,
        },
      });
    }

    logInfo('HubSpot contacts synced successfully', { integrationId, contactCount: contacts.length });
  } catch (error) {
    logError('Error syncing HubSpot contacts', { error, integrationId });
    throw new Error('Failed to sync HubSpot contacts');
  }
};

/**
 * Fetches and syncs HubSpot deals to the database.
 * @param integrationId - The ID of the integration record.
 */
export const syncHubSpotDeals = async (integrationId: string) => {
  try {
    const integration = await prisma.integrationConfig.findUnique({
      where: { id: integrationId },
    });

    if (!integration || !integration.authData?.accessToken) {
      throw new Error('Integration or access token not found');
    }

    if (new Date(integration.authData.expiresAt) <= new Date()) {
      await refreshHubSpotToken(integrationId);
    }

    const { accessToken } = integration.authData;

    const response = await axios.get(`${HUBSPOT_API_BASE}/crm/v3/objects/deals`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { limit: 100, properties: 'dealname,amount,stage' },
    });

    const deals = response.data.results;

    for (const deal of deals) {
      await prisma.deal.upsert({
        where: { externalId: deal.id },
        update: {
          name: deal.properties.dealname,
          amount: parseFloat(deal.properties.amount) || 0,
          stage: deal.properties.stage,
        },
        create: {
          externalId: deal.id,
          name: deal.properties.dealname,
          amount: parseFloat(deal.properties.amount) || 0,
          stage: deal.properties.stage,
          integrationId,
        },
      });
    }

    logInfo('HubSpot deals synced successfully', { integrationId, dealCount: deals.length });
  } catch (error) {
    logError('Error syncing HubSpot deals', { error, integrationId });
    throw new Error('Failed to sync HubSpot deals');
  }
};

/**
 * Fetches and syncs HubSpot companies to the database.
 * @param integrationId - The ID of the integration record.
 */
export const syncHubSpotCompanies = async (integrationId: string) => {
  try {
    const integration = await prisma.integrationConfig.findUnique({
      where: { id: integrationId },
    });

    if (!integration || !integration.authData?.accessToken) {
      throw new Error('Integration or access token not found');
    }

    if (new Date(integration.authData.expiresAt) <= new Date()) {
      await refreshHubSpotToken(integrationId);
    }

    const { accessToken } = integration.authData;

    const response = await axios.get(`${HUBSPOT_API_BASE}/crm/v3/objects/companies`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { limit: 100, properties: 'name,industry,website' },
    });

    const companies = response.data.results;

    for (const company of companies) {
      await prisma.company.upsert({
        where: { externalId: company.id },
        update: {
          name: company.properties.name,
          industry: company.properties.industry,
          website: company.properties.website,
        },
        create: {
          externalId: company.id,
          name: company.properties.name,
          industry: company.properties.industry,
          website: company.properties.website,
          integrationId,
        },
      });
    }

    logInfo('HubSpot companies synced successfully', { integrationId, companyCount: companies.length });
  } catch (error) {
    logError('Error syncing HubSpot companies', { error, integrationId });
    throw new Error('Failed to sync HubSpot companies');
  }
};
