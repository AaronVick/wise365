// services/form-manager.ts
/**
 * Service for managing form templates and submissions
 * 
 * Works with:
 * - models/Resources (form templates)
 * - models/ResourcesData (form submissions)
 * - services/funnel-progress.ts
 * 
 * Handles form template retrieval and context gathering for form-specific chats
 */

import { prisma } from '@/lib/prisma';

interface FormContext {
  template: {
    name: string;
    description: string;
    purpose: string;
    sections: Array<{
      question: string;
      definition: string;
      evaluationCriteria: any;
    }>;
  };
  funnel?: {
    id: string;
    name: string;
    currentProgress: number;
    relevantMilestones: any[];
  };
  previousSubmissions?: Array<{
    timestamp: Date;
    data: any;
    status: string;
  }>;
}

export async function getFormContext(
  formId: string,
  userId: string,
  teamId?: string
): Promise<FormContext> {
  // Get form template
  const formTemplate = await prisma.resources.findUnique({
    where: { id: formId },
    include: {
      requiredFor: {
        include: {
          funnel: true
        }
      }
    }
  });

  if (!formTemplate) {
    throw new Error('Form template not found');
  }

  // Get previous submissions
  const submissions = await prisma.resourcesData.findMany({
    where: {
      resourceId: formId,
      OR: [
        { userId },
        { teamId: teamId || '' }
      ]
    },
    orderBy: { createdAt: 'desc' }
  });

  // Get related funnel context if form is part of a funnel
  const funnelContext = formTemplate.requiredFor[0]?.funnel 
    ? await getFunnelContext(
        formTemplate.requiredFor[0].funnel.id,
        userId,
        teamId
      )
    : undefined;

  return {
    template: {
      name: formTemplate.name,
      description: formTemplate.description,
      purpose: formTemplate.purpose,
      sections: formTemplate.structure as any
    },
    funnel: funnelContext,
    previousSubmissions: submissions.map(sub => ({
      timestamp: sub.createdAt,
      data: sub.data,
      status: 'completed' // You might want to add status logic
    }))
  };
}