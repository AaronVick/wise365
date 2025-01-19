// types/prisma.ts
/**
 * Global type definitions and utilities for Prisma
 * 
 * Provides common type definitions, helper types, and type guards for
 * working with Prisma models throughout the application.
 */

import { Prisma } from '@prisma/client'

// Organization & User Management types
export type OrganizationWithRelations = Prisma.OrganizationGetPayload<{
  include: {
    apiKeys: true
    businessHours: true
    contacts: true
    feedback: true
    invitations: true
    users: true
    webhooks: true
  }
}>

export type UserWithRelations = Prisma.UserGetPayload<{
  include: {
    accounts: true
    authenticatorApp: true
    changeEmailRequests: true
    comments: true
    favorites: true
    feedback: true
    notes: true
    notifications: true
    organization: true
    pageVisits: true
    sessions: true
    teamMembers: {
      include: {
        team: true
      }
    }
    conversations: {
      include: {
        messages: true
      }
    }
    funnelProgress: {
      include: {
        milestones: true
        dataPoints: true
      }
    }
    websiteScrapeJobs: true
  }
}>

export type ApiKeyWithRelations = Prisma.ApiKeyGetPayload<{
  include: {
    organization: true
  }
}>

export type WorkHoursWithRelations = Prisma.WorkHoursGetPayload<{
  include: {
    organization: true
    timeSlots: true
  }
}>

export type InvitationWithRelations = Prisma.InvitationGetPayload<{
  include: {
    organization: true
  }
}>

// Authentication types
export type AccountWithRelations = Prisma.AccountGetPayload<{
  include: {
    user: true
  }
}>

export type SessionWithRelations = Prisma.SessionGetPayload<{
  include: {
    user: true
  }
}>

export type AuthenticatorAppWithRelations = Prisma.AuthenticatorAppGetPayload<{
  include: {
    user: true
  }
}>

// Contact Management types
export type ContactWithRelations = Prisma.ContactGetPayload<{
  include: {
    organization: true
    activities: true
    comments: true
    notes: true
    pageVisits: true
    tags: true
    favorites: true
    tasks: true
  }
}>

export type ContactActivityWithRelations = Prisma.ContactActivityGetPayload<{
  include: {
    contact: true
  }
}>

export type ContactCommentWithRelations = Prisma.ContactCommentGetPayload<{
  include: {
    contact: true
    user: true
  }
}>

export type ContactNoteWithRelations = Prisma.ContactNoteGetPayload<{
  include: {
    contact: true
    user: true
  }
}>

export type ContactPageVisitWithRelations = Prisma.ContactPageVisitGetPayload<{
  include: {
    contact: true
    user: true
  }
}>

export type ContactTagWithRelations = Prisma.ContactTagGetPayload<{
  include: {
    contacts: true
  }
}>

export type ContactTaskWithRelations = Prisma.ContactTaskGetPayload<{
  include: {
    contact: true
  }
}>

export type FavoriteWithRelations = Prisma.FavoriteGetPayload<{
  include: {
    user: true
    contact: true
  }
}>

// Team Management types
export type TeamWithRelations = Prisma.TeamGetPayload<{
  include: {
    members: {
      include: {
        user: true
      }
    }
    funnelProgress: true
    websiteScrapeJobs: true
  }
}>

export type TeamMemberWithRelations = Prisma.TeamMemberGetPayload<{
  include: {
    team: true
    user: true
  }
}>

// Funnel System types
export type FunnelDefinitionWithRelations = Prisma.FunnelDefinitionGetPayload<{
  include: {
    milestones: true
    prerequisites: {
      include: {
        prerequisiteFunnel: true
      }
    }
    requiredBy: {
      include: {
        funnel: true
      }
    }
    progress: {
      include: {
        milestones: true
        dataPoints: true
        assessments: true
      }
    }
    requiredForms: true
    dataPoints: true
    triggers: true
  }
}>

export type FunnelPrerequisiteWithRelations = Prisma.FunnelPrerequisiteGetPayload<{
  include: {
    funnel: true
    prerequisiteFunnel: true
  }
}>

export type FunnelMilestoneWithRelations = Prisma.FunnelMilestoneGetPayload<{
  include: {
    funnel: true
    progress: {
      include: {
        progress: true
      }
    }
  }
}>

export type FunnelProgressWithRelations = Prisma.FunnelProgressGetPayload<{
  include: {
    user: true
    team: true
    funnel: true
    milestones: true
    assessments: true
    analysis: true
    suggestedActions: true
    dataPoints: true
  }
}>

// Additional Funnel Types
export type MilestoneProgressWithRelations = Prisma.MilestoneProgressGetPayload<{
  include: {
    progress: true
    milestone: true
  }
}>

export type FunnelAnalysisRecordWithRelations = Prisma.FunnelAnalysisRecordGetPayload<{
  include: {
    progress: true
  }
}>

export type FunnelSuggestedActionWithRelations = Prisma.FunnelSuggestedActionGetPayload<{
  include: {
    progress: true
  }
}>

export type FunnelDataPointWithRelations = Prisma.FunnelDataPointGetPayload<{
  include: {
    funnel: true
  }
}>

export type FunnelFormRequirementWithRelations = Prisma.FunnelFormRequirementGetPayload<{
  include: {
    funnel: true
  }
}>

export type FunnelTriggerWithRelations = Prisma.FunnelTriggerGetPayload<{
  include: {
    funnel: true
  }
}>

export type FunnelAssessmentWithRelations = Prisma.FunnelAssessmentGetPayload<{
  include: {
    progress: true
  }
}>

export type DataPointCollectionWithRelations = Prisma.DataPointCollectionGetPayload<{
  include: {
    progress: true
  }
}>

// Agent System types
export type AgentWithRelations = Prisma.AgentGetPayload<{
  include: {
    agentData: true
    agentsDefined: true
    conversations: {
      include: {
        messages: true
        analysis: true
      }
    }
  }
}>

export type AgentDataWithRelations = Prisma.AgentDataGetPayload<{
  include: {
    agent: true
  }
}>

export type AgentsDefinedWithRelations = Prisma.AgentsDefinedGetPayload<{
  include: {
    agent: true
  }
}>

// Integration Management types
export type IntegrationConfigWithRelations = Prisma.IntegrationConfigGetPayload<{
  include: {
    user: true
    team: true
    logs: true
    analyses: true
  }
}>

export type IntegrationLogsWithRelations = Prisma.IntegrationLogsGetPayload<{
  include: {
    integration: true
  }
}>

export type IntegrationAnalysisWithRelations = Prisma.IntegrationAnalysisGetPayload<{
  include: {
    integration: true
  }
}>



// Project Management types
export type ProjectWithRelations = Prisma.ProjectGetPayload<{
  include: {
    user: true
    team: true
    goals: {
      include: {
        suggestedGoals: true
        funnelRelations: {
          include: {
            funnel: true
          }
        }
      }
    }
    conversations: {
      include: {
        conversations: true
      }
    }
  }
}>

export type GoalWithRelations = Prisma.GoalGetPayload<{
  include: {
    user: true
    project: true
    suggestedGoals: true
    funnelRelations: {
      include: {
        funnel: true
      }
    }
  }
}>

export type SuggestedGoalWithRelations = Prisma.SuggestedGoalGetPayload<{
  include: {
    goal: true
  }
}>

export type GoalFunnelRelationWithRelations = Prisma.GoalFunnelRelationGetPayload<{
  include: {
    goal: true
    funnel: true
  }
}>

// Conversation Organization types
export type ConversationNameWithRelations = Prisma.ConversationNameGetPayload<{
  include: {
    user: true
    project: true
    conversations: {
      include: {
        messages: true
        analysis: true
      }
    }
  }
}>

// Conversation System types
export type UserConversationWithRelations = Prisma.UserConversationGetPayload<{
  include: {
    user: true
    agent: true
    name: true
    messages: true
    analysis: true
  }
}>

export type ConversationMessageWithRelations = Prisma.ConversationMessageGetPayload<{
  include: {
    conversation: true
  }
}>

export type ConversationAnalysisWithRelations = Prisma.ConversationAnalysisGetPayload<{
  include: {
    conversation: true
  }
}>

// Website Scraping types
export type WebsiteScrapeJobWithRelations = Prisma.WebsiteScrapeJobGetPayload<{
  include: {
    team: true
    user: true
    pages: true
    progress: {
      orderBy: {
        timestamp: 'desc'
      }
      take: 1
    }
  }
}>

export type WebsitePageWithRelations = Prisma.WebsitePageGetPayload<{
  include: {
    scrapeJob: true
  }
}>

export type WebsiteScrapeProgressWithRelations = Prisma.WebsiteScrapeProgressGetPayload<{
  include: {
    scrapeJob: true
  }
}>

// Routing Management types
export type RouterConfigWithRelations = Prisma.RouterConfigGetPayload<{
  select: {
    id: true
    taskType: true
    priority: true
    provider: true
    model: true
    isDefault: true
    cost: true
    capabilities: true
    metadata: true
    createdAt: true
    updatedAt: true
  }
}>

export type RoutingPreferenceWithRelations = Prisma.RoutingPreferenceGetPayload<{
  select: {
    id: true
    tenantId: true
    taskType: true
    provider: true
    model: true
    priority: true
    createdAt: true
    updatedAt: true
  }
}>

export type RoutingHistoryWithRelations = Prisma.RoutingHistoryGetPayload<{
  select: {
    id: true
    conversationId: true
    messageId: true
    notDiamondRoute: true
    actualRoute: true
    reason: true
    performance: true
    createdAt: true
  }
}>

// Common types for JSON fields
export type JSONValue = 
  | string
  | number
  | boolean
  | null 
  | { [key: string]: JSONValue }
  | Array<JSONValue>

export type Settings = {
  theme?: string
  notifications?: boolean
  language?: string
  [key: string]: any
}

export type ValidationRules = {
  required?: boolean
  min?: number
  max?: number
  pattern?: string
  custom?: string[]
  [key: string]: any
}

export type AnalysisFindings = {
  confidence: number
  category: string
  details: Record<string, any>
  recommendations?: string[]
  [key: string]: any
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T[P] extends object
    ? DeepPartial<T[P]>
    : T[P]
}

export type QueryOptions = {
  include?: Record<string, boolean | Record<string, any>>
  where?: Record<string, any>
  orderBy?: Record<string, 'asc' | 'desc'>
  take?: number
  skip?: number
}