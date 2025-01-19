// services/funnel-progress.ts

// File Structure:
//
// /services/funnel-progress.ts        - Core calculation logic
// /api/routes/funnel-progress.ts      - API endpoint handler
// /pages/api/funnel-progress.ts       - Next.js API route


export class FunnelProgressCalculator {
  /**
   * Calculate overall funnel completion percentage
   */
  async calculateFunnelCompletion(
    funnelId: string,
    userId: string,
    teamId?: string
  ): Promise<number> {
    const prisma = new PrismaClient();

    // Get funnel definition with milestones and data points
    const funnel = await prisma.funnelDefinition.findUnique({
      where: { id: funnelId },
      include: {
        milestones: true,
        dataPoints: true,
        requiredForms: true
      }
    });

    // Get current progress
    const progress = await prisma.funnelProgress.findFirst({
      where: {
        funnelId,
        OR: [
          { userId },
          { teamId: teamId || '' }
        ]
      },
      include: {
        milestones: true,
        dataPoints: {
          where: {
            isValidated: true
          }
        }
      }
    });

    if (!funnel || !progress) {
      return 0;
    }

    // Calculate weights
    const totalWeight = this.calculateTotalWeight(funnel);
    
    // Calculate milestone completion
    const milestonePercentage = this.calculateMilestonePercentage(
      funnel.milestones,
      progress.milestones
    );

    // Calculate data point completion
    const dataPointPercentage = this.calculateDataPointPercentage(
      funnel.dataPoints,
      progress.dataPoints
    );

    // Calculate form completion
    const formPercentage = await this.calculateFormPercentage(
      funnel.requiredForms,
      userId,
      teamId
    );

    // Weighted average of all components
    const totalPercentage = (
      (milestonePercentage * 0.5) +    // Milestones are 50% of progress
      (dataPointPercentage * 0.3) +    // Data points are 30% of progress
      (formPercentage * 0.2)           // Forms are 20% of progress
    );

    return Math.round(totalPercentage * 100) / 100;
  }

  /**
   * Calculate milestone completion percentage
   */
  private calculateMilestonePercentage(
    milestones: FunnelMilestone[],
    completedMilestones: MilestoneProgress[]
  ): number {
    const weights = this.assignMilestoneWeights(milestones);
    let completedWeight = 0;
    let totalWeight = 0;

    weights.forEach(milestone => {
      totalWeight += milestone.weight;
      
      const isCompleted = completedMilestones.some(
        progress => progress.milestoneId === milestone.id && 
                   progress.status === 'completed'
      );

      if (isCompleted) {
        completedWeight += milestone.weight;
      }
    });

    return totalWeight > 0 ? (completedWeight / totalWeight) : 0;
  }

  /**
   * Calculate data point completion percentage
   */
  private calculateDataPointPercentage(
    requiredPoints: FunnelDataPoint[],
    collectedPoints: DataPointCollection[]
  ): number {
    const weights = this.assignDataPointWeights(requiredPoints);
    let completedWeight = 0;
    let totalWeight = 0;

    weights.forEach(point => {
      totalWeight += point.weight;
      
      const isCollected = collectedPoints.some(
        collected => collected.dataPointId === point.id &&
                    collected.isValidated
      );

      if (isCollected) {
        completedWeight += point.weight;
      }
    });

    return totalWeight > 0 ? (completedWeight / totalWeight) : 0;
  }

  /**
   * Calculate form completion percentage
   */
  private async calculateFormPercentage(
    requiredForms: FunnelFormRequirement[],
    userId: string,
    teamId?: string
  ): Promise<number> {
    const prisma = new PrismaClient();
    let completed = 0;
    let total = requiredForms.length;

    for (const form of requiredForms) {
      const submission = await prisma.formSubmission.findFirst({
        where: {
          formId: form.formId,
          OR: [
            { userId },
            { teamId: teamId || '' }
          ]
        }
      });

      if (submission) {
        completed++;
      }
    }

    return total > 0 ? (completed / total) : 0;
  }

  /**
   * Assign weights to milestones based on importance
   */
  private assignMilestoneWeights(
    milestones: FunnelMilestone[]
  ): MilestoneWeight[] {
    return milestones.map(milestone => ({
      id: milestone.id,
      weight: milestone.isRequired ? 2 : 1,  // Required milestones count double
      required: milestone.isRequired
    }));
  }

  /**
   * Assign weights to data points based on importance
   */
  private assignDataPointWeights(
    dataPoints: FunnelDataPoint[]
  ): DataPointWeight[] {
    return dataPoints.map(point => ({
      id: point.id,
      weight: point.isRequired ? 2 : 1,  // Required data points count double
      required: point.isRequired
    }));
  }
}