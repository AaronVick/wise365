// /services/admin/sentry-service.js
// This file provides service functions to interact with Sentry's API for fetching project issues and performance metrics.

const axios = require('axios');

// Sentry API base URL
const SENTRY_API_URL = 'https://sentry.io/api/0';

// Sentry authentication token, loaded from environment variables
const SENTRY_AUTH_TOKEN = process.env.SENTRY_AUTH_TOKEN;

/**
 * Fetch issues from Sentry for a specific project
 * @param {string} projectSlug - The slug of the Sentry project
 * @param {string} organizationSlug - The slug of your Sentry organization
 * @returns {Promise<object[]>} - List of issues
 * @throws Will throw an error if the request fails
 */
async function fetchSentryIssues(projectSlug, organizationSlug) {
  try {
    // API call to Sentry to fetch project issues
    const response = await axios.get(
      `${SENTRY_API_URL}/projects/${organizationSlug}/${projectSlug}/issues/`,
      {
        headers: {
          Authorization: `Bearer ${SENTRY_AUTH_TOKEN}`, // Authenticate using the API token
        },
      }
    );
    return response.data; // Return the list of issues
  } catch (error) {
    console.error('Error fetching Sentry issues:', error.message);
    throw new Error('Failed to fetch Sentry issues'); // Re-throw error with custom message
  }
}

/**
 * Fetch performance metrics from Sentry
 * @param {string} projectSlug - The slug of the Sentry project
 * @param {string} organizationSlug - The slug of your Sentry organization
 * @returns {Promise<object>} - Performance metrics
 * @throws Will throw an error if the request fails
 */
async function fetchPerformanceMetrics(projectSlug, organizationSlug) {
  try {
    // API call to Sentry to fetch performance metrics
    const response = await axios.get(
      `${SENTRY_API_URL}/organizations/${organizationSlug}/projects/${projectSlug}/performance/`,
      {
        headers: {
          Authorization: `Bearer ${SENTRY_AUTH_TOKEN}`, // Authenticate using the API token
        },
      }
    );
    return response.data; // Return the performance metrics
  } catch (error) {
    console.error('Error fetching Sentry performance metrics:', error.message);
    throw new Error('Failed to fetch performance metrics'); // Re-throw error with custom message
  }
}

// Export the service functions for use in other parts of the application
module.exports = {
  fetchSentryIssues,
  fetchPerformanceMetrics,
};
