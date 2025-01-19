/**
 * File: /api/resources/success_wheel/reminder.ts
 * 
 * Description: 
 * Manages the scheduling and sending of MSW reassessment reminders.
 * Checks assessment age and user progress to determine reminder timing.
 * 
 * Related Files:
 * - /services/notifications.ts - Notification handling
 * - /services/scheduler.ts - Reminder scheduling
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { scheduleReminder } from '../../../services/scheduler';
import { sendNotification } from '../../../services/notifications';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, teamId } = req.body;

    // Find latest assessment
    const latestAssessment = await prisma.funnelAssessment.findFirst({
      where: {
        type: 'MSW',
        progress: {
          userId,
          teamId
        }
      },
      orderBy: { conductedAt: 'desc' }
    });

    if (latestAssessment) {
      // Schedule reminder based on nextAssessmentDue
      await scheduleReminder({
        userId,
        type: 'MSW_REASSESSMENT',
        dueDate: latestAssessment.nextAssessmentDue,
        metadata: { lastAssessmentId: latestAssessment.id }
      });

      // Send notification if assessment is due soon
      if (latestAssessment.nextAssessmentDue <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) {
        await sendNotification({
          userId,
          subject: 'Marketing Success Wheel Reassessment Due',
          content: 'Your MSW assessment is due for review. Would you like to update it?'
        });
      }
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error scheduling MSW reminder:', error);
    return res.status(500).json({ error: 'Failed to schedule reminder' });
  }
}