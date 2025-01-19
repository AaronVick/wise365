/**
 * File: /pages/api/team/permissions.ts
 * 
 * Description: 
 * Manages role-based access control (RBAC) for team members. Handles role
 * assignments, permission checks, and access control for team resources
 * and functionalities.
 * 
 * Supporting Files:
 * - /services/team/rbac.ts: Permission management
 * - /services/audit-logger.ts: Permission change logging
 * - Database Models: Team, TeamMember, Role
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { formatApiResponse, handleApiError } from '../../../lib/api-utils';
import { logAuditEvent } from '../../../services/audit-logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      return handleGetPermissions(req, res);
    case 'PUT':
      return handleUpdatePermissions(req, res);
    default:
      return handleApiError(res, new Error('Method not allowed'), 'Method not supported');
  }
}

async function handleGetPermissions(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { teamId, userId } = req.query;

    // Fetch team member permissions
    const permissions = await prisma.teamMember.findMany({
      where: {
        teamId: teamId as string,
        userId: userId ? userId as string : undefined
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return res.status(200).json(formatApiResponse(permissions));

  } catch (error) {
    console.error('Error fetching permissions:', error);
    return handleApiError(res, error, 'Failed to fetch permissions');
  }
}

async function handleUpdatePermissions(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { teamId, userId, role } = req.body;

    // Verify admin permissions
    const adminMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: req.body.requesterId,
        role: 'ADMIN'
      }
    });

    if (!adminMember) {
      return res.status(403).json(formatApiResponse(null, 'Insufficient permissions', false));
    }

    // Update member role
    const updated = await prisma.teamMember.update({
      where: {
        teamId_userId: {
          teamId,
          userId
        }
      },
      data: {
        role
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    // Log permission change
    await logAuditEvent({
      teamId,
      actorId: req.body.requesterId,
      action: 'UPDATE_ROLE',
      targetId: userId,
      details: {
        oldRole: updated.role,
        newRole: role
      }
    });

    return res.status(200).json(formatApiResponse(updated));

  } catch (error) {
    console.error('Error updating permissions:', error);
    return handleApiError(res, error, 'Failed to update permissions');
  }
}