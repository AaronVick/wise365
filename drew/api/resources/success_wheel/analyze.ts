/**
 * File: /api/resources/success_wheel/analyze.ts
 * 
 * Description: 
 * Analyzes existing MSW assessment data to provide insights and recommendations.
 * Uses Not Diamond for routing to optimal LLM for analysis.
 * 
 * Related Files:
 * - /services/msw/analysis.ts - Core analysis logic
 * - /services/routing/implementations/not-diamond.service.ts - LLM routing
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { NotDiamondService } from '../../../services/routing/implementations/not-diamond.service';
import { analyzeMSWData } from '../../../services/msw/analysis';
import { prisma } from '../../../lib/prisma';

const notDiamondService = new NotDiamondService();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { assessmentId } = req.body;

    // Fetch assessment data
    const assessment = await prisma.funnelAssessment.findUnique({
      where: { id: assessmentId }
    });

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    // Route analysis to optimal LLM
    const routingConfig = await notDiamondService.routeTask({
      taskType: 'mswAnalysis',
      content: assessment
    });

    // Generate insights
    const analysis = await analyzeMSWData(assessment, routingConfig);

    return res.status(200).json(analysis);
  } catch (error) {
    console.error('Error analyzing MSW:', error);
    return res.status(500).json({ error: 'Analysis failed' });
  }
}