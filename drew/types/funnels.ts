// types/funnel.ts

// File Structure:
//
// /services/funnel-progress.ts        - Core calculation logic
// /api/routes/funnel-progress.ts      - API endpoint handler
// /pages/api/funnel-progress.ts       - Next.js API route


export interface FunnelProgress {
  funnelId: string;
  name: string;
  description: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'paused';
  completionPercentage: number;
  currentMilestone?: {
    id: string;
    name: string;
    description: string;
    order: number;
  };
  isAvailable: boolean;  // Based on prerequisites
  nextFunnels?: Array<{
    id: string;
    name: string;
    prerequisites: string[];
  }>;
}