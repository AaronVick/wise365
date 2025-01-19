// /pages/api/admin/sentry.js
// This API endpoint handles incoming requests to fetch Sentry issues or performance metrics based on query parameters.

const { fetchSentryIssues, fetchPerformanceMetrics } = require('../../../services/admin/sentry-service');

export default async function handler(req, res) {
  // Extract query parameters from the request
  const { projectSlug, organizationSlug, type } = req.query;

  // Validate the required parameters
  if (!projectSlug || !organizationSlug) {
    return res.status(400).json({ error: 'Missing projectSlug or organizationSlug' });
  }

  try {
    // Handle requests for issues
    if (type === 'issues') {
      const issues = await fetchSentryIssues(projectSlug, organizationSlug);
      return res.status(200).json(issues); // Return the fetched issues
    }

    // Handle requests for performance metrics
    if (type === 'performance') {
      const metrics = await fetchPerformanceMetrics(projectSlug, organizationSlug);
      return res.status(200).json(metrics); // Return the fetched metrics
    }

    // Invalid type parameter
    return res.status(400).json({ error: 'Invalid type parameter' });
  } catch (error) {
    // Handle unexpected errors
    console.error('API Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
