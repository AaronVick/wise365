// pages/api/funnel-progress.ts

// File Structure:
//
// /services/funnel-progress.ts        - Core calculation logic
// /api/routes/funnel-progress.ts      - API endpoint handler
// /pages/api/funnel-progress.ts       - Next.js API route

import { NextApiRequest, NextApiResponse } from 'next';
import { getCurrentFunnels } from '@/api/routes/funnel-progress';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * API endpoint for fetching funnel progress
 * 
 * @route GET /api/funnel-progress
 * @query userId - The user's ID
 * @query teamId - Optional team ID
 * @returns FunnelProgress[] - Array of funnel progress data
 * 
 * Works with:
 * - /api/routes/funnel-progress.ts (business logic)
 * - /services/funnel-progress.ts (calculation service)
 */

export interface ApiError {
  error: string;
  details?: unknown;
}

export interface FunnelProgressResponse {
  funnels: FunnelProgress[];
  timestamp: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FunnelProgressResponse | ApiError>
) {
  try {
    // Verify method
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Get auth session
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate query parameters
    const { userId, teamId } = req.query;
    
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ 
        error: 'Invalid userId parameter',
        details: 'userId is required and must be a string'
      });
    }

    // Verify user has access to requested data
    if (session.user.id !== userId && !await checkUserTeamAccess(userId, session.user.id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Get funnel progress
    const funnels = await getCurrentFunnels(
      userId,
      typeof teamId === 'string' ? teamId : undefined
    );
    
    // Return response with timestamp
    return res.status(200).json({
      funnels,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    // Log error for debugging
    console.error('Error in funnel-progress API:', error);

    // Determine if error is known type
    if (error instanceof PrismaClientKnownRequestError) {
      return res.status(400).json({
        error: 'Database error',
        details: error.message
      });
    }

    // Default error response
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Helper function to verify user has access to team data
 */
async function checkUserTeamAccess(
  targetUserId: string,
  requestingUserId: string
): Promise<boolean> {
  try {
    const prisma = new PrismaClient();
    
    // Check if users are in same team
    const teamMemberships = await prisma.teamMember.findMany({
      where: {
        userId: {
          in: [targetUserId, requestingUserId]
        }
      }
    });

    // Group by teamId
    const teamGroups = teamMemberships.reduce((acc, member) => {
      acc[member.teamId] = [...(acc[member.teamId] || []), member.userId];
      return acc;
    }, {} as Record<string, string[]>);

    // Check if there's any team with both users
    return Object.values(teamGroups).some(
      members => members.includes(targetUserId) && members.includes(requestingUserId)
    );

  } catch (error) {
    console.error('Error checking team access:', error);
    return false;
  }
}
