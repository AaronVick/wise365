// File: src/pages/api/team/highlights.ts
// Synopsis: API endpoint to fetch team highlights by orchestrating the highlight service.
// Supporting Files:
// - src/services/team/highlight-service.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { getTeamHighlights } from '../../../services/team/highlight-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Validate request method
    if (req.method !== 'GET') {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    // Extract query parameters
    const { teamId, userId, timeRange } = req.query;

    if (!teamId) {
      return res.status(400).json({ success: false, message: 'teamId is required' });
    }

    // Fetch highlights
    const highlights = await getTeamHighlights(teamId as string, userId as string, timeRange as string);

    // Respond with highlights
    res.status(200).json({ success: true, highlights });
  } catch (error) {
    console.error('Error in /api/team/highlights:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
