/**
 * File: /pages/api/team/collaboration.ts
 * 
 * Description: 
 * Manages team collaboration settings and preferences, including notification
 * preferences, communication channels, and team member visibility settings.
 * Controls how team members interact and share information.
 * 
 * Supporting Files:
 * - /services/team/settings-manager.ts: Team settings management
 * - /services/notifications.ts: Notification preferences
 * - Database Models: Team, TeamMember, UserSettings
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { formatApiResponse, handleApiError } from '../../../lib/api-utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      return handleGetSettings(req, res);
    case 'PUT':
      return handleUpdateSettings(req, res);
    default:
      return handleApiError(res, new Error('Method not allowed'), 'Method not supported');
  }
}

async function handleGetSettings(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { teamId } = req.query;

    // Fetch team collaboration settings
    const settings = await prisma.team.findUnique({
      where: { id: teamId as string },
      select: {
        settings: true,
        members: {
          select: {
            id: true,
            userId: true,
            role: true,
            user: {
              select: {
                name: true,
                email: true,
                settings: true
              }
            }
          }
        }
      }
    });

    if (!settings) {
      return res.status(404).json(formatApiResponse(null, 'Team not found', false));
    }

    return res.status(200).json(formatApiResponse(settings));

  } catch (error) {
    console.error('Error fetching collaboration settings:', error);
    return handleApiError(res, error, 'Failed to fetch settings');
  }
}

async function handleUpdateSettings(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { teamId, settings } = req.body;

    // Verify admin permissions
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: req.body.userId,
        role: 'ADMIN'
      }
    });

    if (!teamMember) {
      return res.status(403).json(formatApiResponse(null, 'Insufficient permissions', false));
    }

    // Update team settings
    const updated = await prisma.team.update({
      where: { id: teamId },
      data: {
        settings: {
          ...settings,
          updatedAt: new Date(),
          updatedBy: req.body.userId
        }
      }
    });

    // Update member notification preferences if specified
    if (settings.notifications) {
      await Promise.all(settings.notifications.map(async (pref) => {
        await prisma.user.update({
          where: { id: pref.userId },
          data: {
            settings: {
              notifications: {
                ...pref.settings
              }
            }
          }
        });
      }));
    }

    return res.status(200).json(formatApiResponse(updated));

  } catch (error) {
    console.error('Error updating collaboration settings:', error);
    return handleApiError(res, error, 'Failed to update settings');
  }
}