/**
 * File: /api/resources/success_wheel/submit.ts
 * 
 * Description: 
 * Handles submission of Marketing Success Wheel assessments. Stores both the raw 
 * scores and processed insights in the database while updating relevant funnel progress.
 * 
 * Related Files:
 * - /api/resources/success_wheel/types.ts - Type definitions
 * - /services/msw/analysis.ts - Analysis logic
 * - /services/updateFunnelProgress.ts - Updates funnel progress based on MSW
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { validateMSWSubmission } from './validation';
import { analyzeMSWScores } from '../../../services/msw/analysis';
import { updateFunnelProgress } from '../../../services/updateFunnelProgress';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, teamId, scores } = req.body;

    // Validate submission data
    const validationResult = validateMSWSubmission(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ error: validationResult.error });
    }

    // Create assessment record
    const assessment = await prisma.funnelAssessment.create({
      data: {
        progressId: req.body.progressId,
        type: 'MSW',
        metrics: scores,
        recommendations: await analyzeMSWScores(scores),
        nextAssessmentDue: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
      }
    });

    // Update funnel progress based on MSW scores
    await updateFunnelProgress(userId, 'MSW_FUNNEL', {
      completedAssessment: true,
      scores: scores
    });

    return res.status(200).json({ success: true, assessment });
  } catch (error) {
    console.error('Error submitting MSW:', error);
    return res.status(500).json({ error: 'Failed to submit assessment' });
  }
}