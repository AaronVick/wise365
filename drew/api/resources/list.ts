// api/resources/list.ts

/**
 * Provides a list of available resources/forms with completion status and metadata.
 * 
 * This API returns resources that are available to users based on their funnel
 * progress and team context. It includes completion status for both individual
 * and team-based resources.
 * 
 * @description Returns paginated list of resources with completion status
 * 
 * This route works with:
 * - models/FunnelFormRequirement: Available forms/resources
 * - models/DataPointCollection: Tracks form completion
 * - services/funnel-progress.ts: Checks funnel progress for requirements
 */

import { PrismaClient } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';

interface ResourceResponse {
  id: string;
  name: string;
  description: string;
  type: 'assessment' | 'form' | 'worksheet';
  category: string;
  status: {
    isNew: boolean;
    userCompleted: boolean;
    teamCompleted?: boolean;
    lastUpdated?: Date;
    completedBy?: string;
  };
  metadata: {
    estimatedTime?: string;
    difficulty?: 'basic' | 'intermediate' | 'advanced';
    prerequisites?: string[];
    relatedFunnels?: string[];
    isRequired?: boolean;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const prisma = new PrismaClient();
  const { 
    userId, 
    teamId,
    category,
    type,
    status,
    page = '1',
    pageSize = '10'
  } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    // Get user's current funnel progress to determine available resources
    const userProgress = await prisma.funnelProgress.findMany({
      where: {
        userId: userId as string,
        teamId: teamId as string || undefined
      },
      include: {
        funnel: {
          include: {
            formRequirements: true
          }
        }
      }
    });

    // Get all form requirements relevant to user's funnels
    const formRequirements = userProgress.flatMap(progress => 
      progress.funnel.formRequirements
    );

    // Get completion data for user and team
    const [userCompletions, teamCompletions] = await Promise.all([
      prisma.dataPointCollection.findMany({
        where: {
          userId: userId as string
        },
        select: {
          dataPointId: true,
          collectedAt: true
        }
      }),
      teamId ? prisma.dataPointCollection.findMany({
        where: {
          teamId: teamId as string
        },
        select: {
          dataPointId: true,
          collectedAt: true,
          userId: true
        }
      }) : Promise.resolve([])
    ]);

    // Get last viewed/updated timestamps for "new" status
    const userViews = await prisma.resourceView.findMany({
      where: {
        userId: userId as string
      },
      select: {
        resourceId: true,
        lastViewed: true
      }
    });

    // Filter and format resources
    let resources: ResourceResponse[] = formRequirements.map(form => {
      const userCompleted = userCompletions.some(uc => 
        uc.dataPointId === form.formId
      );

      const teamCompletion = teamCompletions.find(tc =>
        tc.dataPointId === form.formId
      );

      const lastViewed = userViews.find(view => 
        view.resourceId === form.formId
      )?.lastViewed;

      return {
        id: form.formId,
        name: form.name || 'Unnamed Form',
        description: form.description || '',
        type: form.type || 'form',
        category: form.category || 'general',
        status: {
          isNew: !lastViewed,
          userCompleted,
          teamCompleted: !!teamCompletion,
          lastUpdated: teamCompletion?.collectedAt || undefined,
          completedBy: teamCompletion?.userId
        },
        metadata: {
          estimatedTime: form.estimatedTime,
          difficulty: form.difficulty,
          prerequisites: form.prerequisites,
          relatedFunnels: [form.funnelId],
          isRequired: form.isRequired
        }
      };
    });

    // Apply filters
    if (category) {
      resources = resources.filter(r => r.category === category);
    }
    if (type) {
      resources = resources.filter(r => r.type === type);
    }
    if (status) {
      switch(status) {
        case 'new':
          resources = resources.filter(r => r.status.isNew);
          break;
        case 'completed':
          resources = resources.filter(r => r.status.userCompleted);
          break;
        case 'pending':
          resources = resources.filter(r => !r.status.userCompleted);
          break;
      }
    }

    // Pagination
    const pageNum = parseInt(page as string);
    const size = parseInt(pageSize as string);
    const totalCount = resources.length;
    const totalPages = Math.ceil(totalCount / size);
    
    resources = resources.slice((pageNum - 1) * size, pageNum * size);

    return res.status(200).json({
      resources,
      pagination: {
        currentPage: pageNum,
        pageSize: size,
        totalPages,
        totalCount
      }
    });

  } catch (error) {
    console.error('Failed to fetch resources:', error);
    return res.status(500).json({ error: 'Failed to fetch resources' });
  } finally {
    await prisma.$disconnect();
  }
}