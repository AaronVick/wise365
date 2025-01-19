// File: src/services/integrations/hubspot/hubspot-marketing-client.ts
/**
 * HubSpot Marketing Client
 * ------------------------
 * Description:
 * This file handles interactions with the HubSpot Marketing API. It provides functionality
 * to fetch and sync campaign data, performance metrics, and campaign content (copy, headings, etc.).
 * 
 * Supporting Files:
 * - src/lib/prisma.ts: Handles database operations to save marketing data.
 * - src/utils/logger.ts: Logs API calls and errors for debugging.
 * - src/services/integrations/hubspot/hubspot-auth.ts: Manages authentication tokens for API access.
 */

import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { getAccessToken } from './hubspot-auth';
import logger from '../../../utils/logger';

const prisma = new PrismaClient();

// Base URL for HubSpot Marketing API
const HUBSPOT_MARKETING_BASE_URL = 'https://api.hubapi.com';

/**
 * Fetches campaign data from HubSpot Marketing API.
 * @param integrationId - The ID of the integration configuration in the database.
 * @returns Fetched campaign data.
 */
export async function fetchCampaigns(integrationId: string) {
  try {
    // Get access token from the database
    const accessToken = await getAccessToken(integrationId);

    // Fetch campaign data from HubSpot
    const response = await axios.get(`${HUBSPOT_MARKETING_BASE_URL}/email/public/v1/campaigns`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const campaigns = response.data.campaigns;

    // Save campaigns to the database
    await prisma.campaign.createMany({
      data: campaigns.map((campaign: any) => ({
        integrationId,
        campaignId: campaign.id,
        name: campaign.name,
        status: campaign.status,
        createdAt: new Date(campaign.created),
        updatedAt: new Date(campaign.updated),
      })),
      skipDuplicates: true,
    });

    logger.info(`Fetched and saved ${campaigns.length} campaigns for integration ${integrationId}`);
    return campaigns;
  } catch (error) {
    logger.error(`Failed to fetch campaigns for integration ${integrationId}: ${error.message}`);
    throw new Error('Error fetching campaigns from HubSpot.');
  }
}

/**
 * Fetches performance metrics for a specific campaign.
 * @param integrationId - The ID of the integration configuration in the database.
 * @param campaignId - The ID of the campaign in HubSpot.
 * @returns Fetched performance metrics.
 */
export async function fetchCampaignPerformance(integrationId: string, campaignId: string) {
  try {
    // Get access token from the database
    const accessToken = await getAccessToken(integrationId);

    // Fetch campaign performance data
    const response = await axios.get(
      `${HUBSPOT_MARKETING_BASE_URL}/email/public/v1/campaigns/${campaignId}/stats`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const performance = response.data;

    // Save performance data to the database
    await prisma.campaignPerformance.upsert({
      where: { campaignId },
      update: {
        openRate: performance.openRate,
        clickRate: performance.clickRate,
        bounceRate: performance.bounceRate,
        updatedAt: new Date(),
      },
      create: {
        integrationId,
        campaignId,
        openRate: performance.openRate,
        clickRate: performance.clickRate,
        bounceRate: performance.bounceRate,
        updatedAt: new Date(),
      },
    });

    logger.info(`Fetched and saved performance metrics for campaign ${campaignId}`);
    return performance;
  } catch (error) {
    logger.error(`Failed to fetch performance metrics for campaign ${campaignId}: ${error.message}`);
    throw new Error('Error fetching campaign performance data from HubSpot.');
  }
}

/**
 * Fetches campaign content (copy and headings).
 * @param integrationId - The ID of the integration configuration in the database.
 * @param campaignId - The ID of the campaign in HubSpot.
 * @returns Fetched campaign content.
 */
export async function fetchCampaignContent(integrationId: string, campaignId: string) {
  try {
    // Get access token from the database
    const accessToken = await getAccessToken(integrationId);

    // Fetch campaign content
    const response = await axios.get(
      `${HUBSPOT_MARKETING_BASE_URL}/email/public/v1/campaigns/${campaignId}/content`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const content = response.data;

    // Save campaign content to the database
    await prisma.campaignContent.upsert({
      where: { campaignId },
      update: {
        subjectLine: content.subjectLine,
        emailBody: content.emailBody,
        callToAction: content.callToAction,
        updatedAt: new Date(),
      },
      create: {
        integrationId,
        campaignId,
        subjectLine: content.subjectLine,
        emailBody: content.emailBody,
        callToAction: content.callToAction,
        updatedAt: new Date(),
      },
    });

    logger.info(`Fetched and saved content for campaign ${campaignId}`);
    return content;
  } catch (error) {
    logger.error(`Failed to fetch content for campaign ${campaignId}: ${error.message}`);
    throw new Error('Error fetching campaign content from HubSpot.');
  }
}
