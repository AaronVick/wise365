/**
 * File: src/services/integrations/hubspot/hubspot-auth.ts
 *
 * Description:
 * Handles HubSpot OAuth authentication, including generating the authorization URL,
 * handling the OAuth callback to exchange tokens, and refreshing expired tokens.
 * 
 * Supporting Files:
 * - src/utils/logger.ts: For structured logging of events and errors.
 * - src/lib/prisma.ts: For database operations on the IntegrationConfig table.
 * 
 * Dependencies:
 * - Axios: For HTTP requests to HubSpot API endpoints.
 * - PrismaClient: To interact with the database.
 */

// Import dependencies
import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { logInfo, logError } from '@/utils/logger';

// Initialize Prisma Client
const prisma = new PrismaClient();

// HubSpot OAuth constants
const HUBSPOT_CLIENT_ID = process.env.HUBSPOT_CLIENT_ID!;
const HUBSPOT_CLIENT_SECRET = process.env.HUBSPOT_CLIENT_SECRET!;
const REDIRECT_URI = process.env.HUBSPOT_REDIRECT_URI!;
const HUBSPOT_AUTH_URL = 'https://app.hubspot.com/oauth/authorize';
const HUBSPOT_TOKEN_URL = 'https://api.hubapi.com/oauth/v1/token';

/**
 * Generates the OAuth URL for HubSpot integration.
 * @param userId - The ID of the user initiating the connection.
 * @param teamId - (Optional) The ID of the team, if applicable.
 * @returns A URL string for initiating the OAuth flow.
 */
export const getHubSpotAuthUrl = (userId: string, teamId?: string): string => {
  const state = JSON.stringify({ userId, teamId });
  return `${HUBSPOT_AUTH_URL}?client_id=${HUBSPOT_CLIENT_ID}&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&scope=contacts%20crm.objects.deals%20crm.objects.companies%20content%20marketing&state=${encodeURIComponent(
    state
  )}`;
};

/**
 * Handles the OAuth callback from HubSpot.
 * Exchanges the authorization code for an access token and refresh token.
 * @param code - The authorization code provided by HubSpot.
 * @param state - The state string containing userId and teamId.
 */
export const handleHubSpotCallback = async (code: string, state: string) => {
  try {
    const { userId, teamId } = JSON.parse(decodeURIComponent(state));

    // Request tokens from HubSpot
    const response = await axios.post(
      HUBSPOT_TOKEN_URL,
      new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: HUBSPOT_CLIENT_ID,
        client_secret: HUBSPOT_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        code,
      })
    );

    const { access_token, refresh_token, expires_in } = response.data;

    // Save tokens in the database
    await prisma.integrationConfig.upsert({
      where: {
        userId_teamId_platform: {
          userId,
          teamId: teamId || null,
          platform: 'HubSpot',
        },
      },
      update: {
        status: 'enabled',
        authData: {
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresAt: new Date(Date.now() + expires_in * 1000).toISOString(),
        },
      },
      create: {
        userId,
        teamId: teamId || null,
        platform: 'HubSpot',
        status: 'enabled',
        authData: {
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresAt: new Date(Date.now() + expires_in * 1000).toISOString(),
        },
      },
    });

    logInfo('HubSpot tokens successfully saved', { userId, teamId });
  } catch (error) {
    logError('Error handling HubSpot OAuth callback', { error });
    throw new Error('Failed to handle HubSpot callback');
  }
};

/**
 * Refreshes the HubSpot access token if it has expired.
 * @param integrationId - The ID of the integration record in the database.
 */
export const refreshHubSpotToken = async (integrationId: string) => {
  try {
    // Fetch the existing token details from the database
    const integration = await prisma.integrationConfig.findUnique({
      where: { id: integrationId },
    });

    if (!integration || !integration.authData?.refreshToken) {
      throw new Error('Integration or refresh token not found');
    }

    // Make the refresh token request
    const response = await axios.post(
      HUBSPOT_TOKEN_URL,
      new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: HUBSPOT_CLIENT_ID,
        client_secret: HUBSPOT_CLIENT_SECRET,
        refresh_token: integration.authData.refreshToken,
      })
    );

    const { access_token, refresh_token, expires_in } = response.data;

    // Update the tokens in the database
    await prisma.integrationConfig.update({
      where: { id: integrationId },
      data: {
        authData: {
          ...integration.authData,
          accessToken: access_token,
          refreshToken: refresh_token || integration.authData.refreshToken,
          expiresAt: new Date(Date.now() + expires_in * 1000).toISOString(),
        },
      },
    });

    logInfo('HubSpot token refreshed successfully', { integrationId });
  } catch (error) {
    logError('Error refreshing HubSpot token', { error, integrationId });
    throw new Error('Failed to refresh HubSpot token');
  }
};
