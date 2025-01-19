// api/routes/funnel-progress.ts

// File Structure:
//
// /services/funnel-progress.ts        - Core calculation logic
// /api/routes/funnel-progress.ts      - API endpoint handler
// /pages/api/funnel-progress.ts       - Next.js API route


export async function getCurrentFunnels(
  userId: string,
  teamId?: string
): Promise<FunnelProgress[]> {
  const prisma = new PrismaClient();

  // Get all funnel definitions
  const funnelDefinitions = await prisma.funnelDefinition.findMany({
    where: { isActive: true },
    include: {
      prerequisites: true,
      milestones: true,
    },
    orderBy: { level: 'asc' },
  });

  // Get user/team progress
  const progress = await prisma.funnelProgress.findMany({
    where: {
      OR: [
        { userId },
        { teamId: teamId || '' }
      ]
    },
    include: {
      milestones: true,
      funnel: true,
    },
  });

  // Determine available funnels based on prerequisites
  return funnelDefinitions.map(funnel => {
    const userProgress = progress.find(p => p.funnelId === funnel.id);
    const isAvailable = checkFunnelAvailability(funnel, progress);
    
    return {
      funnelId: funnel.id,
      name: funnel.name,
      description: funnel.description || '',
      status: userProgress?.status || 'not_started',
      completionPercentage: userProgress?.completionPercentage || 0,
      currentMilestone: getCurrentMilestone(funnel, userProgress),
      isAvailable,
      nextFunnels: getNextAvailableFunnels(funnel, funnelDefinitions),
    };
  });
}