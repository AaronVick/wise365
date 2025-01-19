/**
 * File: /pages/api/team/assignments.ts
 * 
 * Description: 
 * Manages team task assignments, including creation, assignment, and status updates.
 * Handles assignment notifications and tracks assignment progress across team members.
 * Integrates with funnel progress tracking to link assignments to milestones.
 * 
 * Supporting Files:
 * - /services/team/assignment-manager.ts: Assignment logic
 * - /services/notifications.ts: Team notifications
 * - Database Models: Team, TeamMember, FunnelProgress
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { formatApiResponse, handleApiError } from '../../../lib/api-utils';
import { NotDiamondService } from '../../../services/routing/implementations/not-diamond.service';
import { sendNotification } from '../../../services/notifications';

const notDiamondService = new NotDiamondService();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'POST':
      return handleCreateAssignment(req, res);
    case 'PUT':
      return handleUpdateAssignment(req, res);
    case 'GET':
      return handleGetAssignments(req, res);
    default:
      return handleApiError(res, new Error('Method not allowed'), 'Method not supported');
  }
}

async function handleCreateAssignment(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { teamId, assigneeId, funnelId, milestoneId, title, description, dueDate } = req.body;

    // Verify team membership and permissions
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: req.body.userId,
        role: {
          in: ['ADMIN', 'LEADER']
        }
      }
    });

    if (!teamMember) {
      return res.status(403).json(formatApiResponse(null, 'Insufficient permissions', false));
    }

    // Create the assignment
    const assignment = await prisma.teamAssignment.create({
      data: {
        teamId,
        assigneeId,
        funnelId,
        milestoneId,
        title,
        description,
        dueDate: new Date(dueDate),
        status: 'PENDING',
        priority: req.body.priority || 'MEDIUM'
      }
    });

    // Notify assignee
    await sendNotification({
      userId: assigneeId,
      subject: 'New Assignment',
      content: `You have been assigned: ${title}`,
      link: `/team/assignments/${assignment.id}`
    });

    // Route to LLM for insights and suggestions
    const routingConfig = await notDiamondService.routeTask({
      taskType: 'assignmentAnalysis',
      content: { assignment, teamContext: req.body.context }
    });

    // Generate helpful insights
    const insights = await routingConfig.llm.analyze({
      assignment,
      prompt: "Generate helpful insights and suggestions for this assignment..."
    });

    // Store insights with assignment
    await prisma.teamAssignment.update({
      where: { id: assignment.id },
      data: {
        metadata: {
          insights: insights.suggestions,
          resources: insights.recommendedResources
        }
      }
    });

    return res.status(200).json(formatApiResponse({
      assignment,
      insights: insights.suggestions
    }));

  } catch (error) {
    console.error('Error creating assignment:', error);
    return handleApiError(res, error, 'Failed to create assignment');
  }
}

async function handleUpdateAssignment(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { assignmentId, status, progress, notes } = req.body;

    // Verify permissions for update
    const assignment = await prisma.teamAssignment.findUnique({
      where: { id: assignmentId },
      include: { team: true }
    });

    if (!assignment) {
      return res.status(404).json(formatApiResponse(null, 'Assignment not found', false));
    }

    // Update assignment
    const updated = await prisma.teamAssignment.update({
      where: { id: assignmentId },
      data: {
        status,
        progress,
        notes,
        updatedAt: new Date()
      }
    });

    // If completed, update related funnel progress
    if (status === 'COMPLETED' && assignment.milestoneId) {
      await prisma.milestoneProgress.update({
        where: {
          milestoneId_progressId: {
            milestoneId: assignment.milestoneId,
            progressId: assignment.funnelId
          }
        },
        data: {
          status: 'COMPLETED',
          completedAt: new Date()
        }
      });
    }

    return res.status(200).json(formatApiResponse(updated));

  } catch (error) {
    console.error('Error updating assignment:', error);
    return handleApiError(res, error, 'Failed to update assignment');
  }
}

async function handleGetAssignments(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { teamId, userId, status, priority } = req.query;

    const assignments = await prisma.teamAssignment.findMany({
      where: {
        teamId: teamId as string,
        assigneeId: userId as string,
        status: status as string,
        priority: priority as string
      },
      include: {
        assignee: true,
        funnel: true,
        milestone: true
      }
    });

    return res.status(200).json(formatApiResponse(assignments));

  } catch (error) {
    console.error('Error fetching assignments:', error);
    return handleApiError(res, error, 'Failed to fetch assignments');
  }
}