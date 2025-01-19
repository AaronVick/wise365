/**
 * File: /api/resources/success_wheel/history.ts
 * 
 * Description: 
 * Retrieves historical MSW assessments for a user or team, including trend analysis
 * and progress tracking over time.
 * 
 * Related Files:
 * - /services/msw/trends.ts - Trend analysis logic
 * - /types/msw.ts - Type definitions for MSW data
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { analyzeMSWTrends } from '../../../services/msw/trends';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, teamId, limit = 5 } = req.query;

    // Fetch assessment history
    const assessments = await prisma.funnelAssessment.findMany({
      where: {
        type: 'MSW',
        progress: {
          userId: userId as string,
          teamId: teamId as string
        }
      },
      orderBy: { conductedAt: 'desc' },
      take: Number(limit)
    });

    // Analyze trends if multiple assessments exist
    const trends = assessments.length > 1 
      ? await analyzeMSWTrends(assessments)
      : null;

    return res.status(200).json({
      assessments,
      trends
    });
  } catch (error) {
    console.error('Error fetching MSW history:', error);
    return res.status(500).json({ error: 'Failed to fetch history' });
  }
}