/// types/global.d.ts
/**
 * Global type definitions for the application
 * 
 * Comprehensive type definitions covering all Prisma models and
 * their relationships. Used throughout the application for type safety.
 */

import { Prisma } from '@prisma/client'

declare global {
  // Base Types
  type DbRecord = {
    id: string
    createdAt: Date
    updatedAt?: Date
  }

  // Enums
  type ActionType = 'CREATE' | 'UPDATE' | 'DELETE'
  type ActorType = 'SYSTEM' | 'MEMBER' | 'API'
  type ContactRecord = 'PERSON' | 'COMPANY'
  type ContactStage = 'LEAD' | 'QUALIFIED' | 'OPPORTUNITY' | 'PROPOSAL' | 'IN_NEGOTIATION' | 'LOST' | 'WON'
  type ContactTaskStatus = 'OPEN' | 'COMPLETED'
  type DayOfWeek = 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY'
  type FeedbackCategory = 'SUGGESTION' | 'PROBLEM' | 'QUESTION'
  type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'REVOKED'
  type Role = 'MEMBER' | 'ADMIN'
  type WebhookTrigger = 'CONTACT_CREATED' | 'CONTACT_UPDATED' | 'CONTACT_DELETED'
  type FunnelStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'PAUSED'
  type WebsiteScrapeStatus = 'QUEUED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'

  // Organization & User Management
  namespace OrganizationManagement {
    interface Organization extends DbRecord {
      stripeCustomerId: string
      name: string
      address?: string
      phone?: string
      email?: string
      website?: string
      linkedInProfile?: string
      instagramProfile?: string
      youTubeChannel?: string
      xProfile?: string
      tikTokProfile?: string
      facebookPage?: string
      completedOnboarding: boolean
      tier: string
      apiKeys: ApiKey[]
      businessHours: WorkHours[]
      contacts: Contact[]
      feedback: Feedback[]
      invitations: Invitation[]
      users: User[]
      webhooks: Webhook[]
    }

    interface User extends DbRecord {
      organizationId?: string
      tenantId: string
      image?: string
      name: string
      email?: string
      emailVerified?: Date
      password?: string
      lastLogin?: Date
      lastActive?: Date
      role: Role
      phone?: string
      locale: string
      settings?: Record<string, any>
      completedOnboarding: boolean
      enabledContactsNotifications: boolean
      enabledInboxNotifications: boolean
      enabledWeeklySummary: boolean
      enabledNewsletter: boolean
      enabledProductUpdates: boolean
      
      // Relations
      accounts: Account[]
      authenticatorApp?: AuthenticatorApp
      changeEmailRequests: ChangeEmailRequest[]
      comments: ContactComment[]
      favorites: Favorite[]
      feedback: Feedback[]
      notes: ContactNote[]
      notifications: Notification[]
      organization?: Organization
      pageVisits: ContactPageVisit[]
      sessions: Session[]
      teamMembers: TeamMember[]
      conversations: UserConversation[]
      funnelProgress: FunnelProgress[]
      websiteScrapeJobs: WebsiteScrapeJob[]
    }

    interface ApiKey extends DbRecord {
      organizationId: string
      description: string
      hashedKey: string
      expiresAt?: Date
      lastUsedAt?: Date
      organization: Organization
    }

    interface WorkHours extends DbRecord {
      organizationId: string
      dayOfWeek: DayOfWeek
      organization: Organization
      timeSlots: WorkTimeSlot[]
    }

    interface WorkTimeSlot extends DbRecord {
      workHoursId: string
      start: Date
      end: Date
      workHours: WorkHours
    }
  }

  // Contact Management
  namespace ContactManagement {
    interface Contact extends DbRecord {
      organizationId: string
      record: ContactRecord
      image?: string
      name: string
      email?: string
      address?: string
      phone?: string
      stage: ContactStage
      
      // Relations
      organization: OrganizationManagement.Organization
      activities: ContactActivity[]
      comments: ContactComment[]
      notes: ContactNote[]
      pageVisits: ContactPageVisit[]
      tags: ContactTag[]
      favorites: Favorite[]
      tasks: ContactTask[]
    }

    interface ContactActivity extends DbRecord {
      contactId: string
      actionType: ActionType
      actorId: string
      actorType: ActorType
      metadata?: Record<string, any>
      occurredAt: Date
      contact: Contact
    }

    interface ContactComment extends DbRecord {
      contactId: string
      userId: string
      text: string
      contact: Contact
      user: OrganizationManagement.User
    }

    interface ContactImage extends DbRecord {
      contactId: string
      data?: Uint8Array
      contentType?: string
      hash?: string
    }

    interface ContactNote extends DbRecord {
      contactId: string
      userId: string
      text?: string
      contact: Contact
      user: OrganizationManagement.User
    }

    interface ContactPageVisit extends DbRecord {
      contactId: string
      userId?: string
      timestamp: Date
      contact: Contact
      user?: OrganizationManagement.User
    }

    interface ContactTag extends DbRecord {
      text: string
      contacts: Contact[]
    }

    interface ContactTask extends DbRecord {
      contactId: string
      title: string
      description?: string
      status: ContactTaskStatus
      dueDate?: Date
      contact: Contact
    }

    interface Favorite extends DbRecord {
      userId: string
      contactId: string
      order: number
      user: OrganizationManagement.User
      contact: Contact
    }
  }

  // Team Management
  namespace TeamManagement {
    interface Team extends DbRecord {
      tenantId: string
      name: string
      settings?: Record<string, any>
      
      // Relations
      members: TeamMember[]
      funnelProgress: Funnel.Progress[]
      websiteScrapeJobs: WebsiteScraping.ScrapeJob[]
    }

    interface TeamMember extends DbRecord {
      teamId: string
      userId: string
      role: string
      joinedAt: Date
      
      // Relations
      team: Team
      user: OrganizationManagement.User
    }
  }

  // Funnel System
  namespace Funnel {
    interface Definition extends DbRecord {
      name: string
      description?: string
      priority: number
      level: number
      isActive: boolean
      leadAgentId: string
      supportingAgentIds: string[]
      
      // Relations
      milestones: Milestone[]
      prerequisites: Prerequisite[]
      requiredBy: Prerequisite[]
      progress: Progress[]
      requiredForms: FormRequirement[]
      dataPoints: DataPoint[]
      triggers: Trigger[]
    }


    interface Prerequisite extends DbRecord {
      funnelId: string
      prerequisiteFunnelId: string
      prerequisiteType: string
      conditions: Record<string, any>
      
      // Relations
      funnel: Definition
      prerequisiteFunnel: Definition
    }

    interface Milestone extends DbRecord {
      funnelId: string
      name: string
      description?: string
      order: number
      isRequired: boolean
      validationRules: Record<string, any>
      kpis: Record<string, any>
      
      // Relations
      funnel: Definition
      progress: MilestoneProgress[]
    }

    interface Progress extends DbRecord {
      tenantId: string
      teamId?: string
      userId?: string
      funnelId: string
      status: FunnelStatus
      startedAt: Date
      completedAt?: Date
      completionPercentage: number
      lastActivity: Date
      
      // Relations
      user?: OrganizationManagement.User
      team?: TeamManagement.Team
      funnel: Definition
      milestones: MilestoneProgress[]
      assessments: Assessment[]
      analysis: AnalysisRecord[]
      suggestedActions: SuggestedAction[]
      dataPoints: DataPointCollection[]
    }

    interface MilestoneProgress extends DbRecord {
      progressId: string
      milestoneId: string
      status: string
      startedAt: Date
      completedAt?: Date
      validationResults?: Record<string, any>
      collectedData?: Record<string, any>
      
      // Relations
      progress: Progress
      milestone: Milestone
    }

    interface DataPoint extends DbRecord {
      funnelId: string
      name: string
      description?: string
      dataType: string
      isRequired: boolean
      validationRules: Record<string, any>
      collectionMethod: string
      
      // Relations
      funnel: Definition
    }

    interface FormRequirement extends DbRecord {
      funnelId: string
      formId: string
      isRequired: boolean
      milestoneId?: string
      completionTriggers?: Record<string, any>
      
      // Relations
      funnel: Definition
    }

    interface Trigger extends DbRecord {
      funnelId: string
      triggerType: string
      conditions: Record<string, any>
      actions: Record<string, any>
      priority: number
      
      // Relations
      funnel: Definition
    }

    interface Assessment extends DbRecord {
      progressId: string
      type: string
      conductedAt: Date
      metrics: Record<string, any>
      recommendations: Record<string, any>
      nextAssessmentDue: Date
      
      // Relations
      progress: Progress
    }

    interface AnalysisRecord extends DbRecord {
      progressId: string
      analysisType: string
      timestamp: Date
      findings: Record<string, any>
      recommendations: Record<string, any>
      nextSteps: Record<string, any>
      
      // Relations
      progress: Progress
    }

    interface SuggestedAction extends DbRecord {
      progressId: string
      type: string
      priority: number
      description: string
      reasoning: string
      status: string
      suggestedAt: Date
      expiresAt: Date
      
      // Relations
      progress: Progress
    }

    interface DataPointCollection extends DbRecord {
      progressId: string
      dataPointId: string
      value: Record<string, any>
      source: string
      collectedAt: Date
      confidence: number
      isValidated: boolean
      
      // Relations
      progress: Progress
    }
  }

  // Conversation System
  namespace Conversation {
    interface UserConversation extends DbRecord {
      userId: string
      agentId: string
      projectId?: string
      funnelId?: string
      milestoneId?: string
      startedAt: Date
      lastMessage: Date
      metadata?: Record<string, any>
      
      // Relations
      user: OrganizationManagement.User
      messages: ConversationMessage[]
      analysis: ConversationAnalysis[]
    }

    interface ConversationMessage extends DbRecord {
      conversationId: string
      role: string
      content?: string
      contentType: string
      metadata?: Record<string, any>
      timestamp: Date
      
      // Relations
      conversation: UserConversation
    }

    interface ConversationAnalysis extends DbRecord {
      conversationId: string
      serviceType: string
      isRelevant: boolean
      findings?: Record<string, any>
      extractedData?: Record<string, any>
      analyzedAt: Date
      
      // Relations
      conversation: UserConversation
    }
  }

  // Website Scraping System
  namespace WebsiteScraping {
    interface ScrapeJob extends DbRecord {
      tenantId: string
      teamId?: string
      userId: string
      websiteUrl: string
      status: WebsiteScrapeStatus
      startedAt: Date
      completedAt?: Date
      error?: string
      metadata?: Record<string, any>
      
      // Relations
      team?: TeamManagement.Team
      user: OrganizationManagement.User
      pages: WebsitePage[]
      progress: ScrapeProgress[]
    }

    interface WebsitePage extends DbRecord {
      scrapeJobId: string
      url: string
      title?: string
      content?: string
      metadata?: Record<string, any>
      scrapedAt: Date
      status: string
      errorMessage?: string
      
      // Relations
      scrapeJob: ScrapeJob
    }

    interface ScrapeProgress extends DbRecord {
      scrapeJobId: string
      timestamp: Date
      status: string
      message: string
      details?: Record<string, any>
      
      // Relations
      scrapeJob: ScrapeJob
    }
  }

  // Routing Management
  namespace RoutingManagement {
    interface RouterConfig extends DbRecord {
      taskType: string
      priority: number
      provider: string
      model: string
      isDefault: boolean
      cost: number
      capabilities: Record<string, any>
      metadata?: Record<string, any>
    }

    interface RoutingPreference extends DbRecord {
      tenantId: string
      taskType: string
      provider: string
      model: string
      priority: number
    }

    interface RoutingHistory extends DbRecord {
      conversationId: string
      messageId: string
      notDiamondRoute: Record<string, any>
      actualRoute: Record<string, any>
      reason: string
      performance: Record<string, any>
    }
  }
}

// Integration System
namespace IntegrationSystem {
  interface IntegrationConfig extends DbRecord {
    userId?: string
    teamId?: string
    platform: string // E.g., "HubSpot", "LinkedIn", "Google Analytics"
    status: string   // E.g., "enabled", "disabled"
    authData: Record<string, any>
    settings?: Record<string, any>

    // Relations
    user?: OrganizationManagement.User
    team?: TeamManagement.Team
    logs: IntegrationLogs[]
    analyses: IntegrationAnalysis[]
  }

  interface IntegrationLogs extends DbRecord {
    integrationId: string
    eventType: string // E.g., "sync", "fetch", "error"
    description: string
    details?: Record<string, any>
    timestamp: Date

    // Relations
    integration: IntegrationConfig
  }

  interface IntegrationAnalysis extends DbRecord {
    integrationId: string
    backendService?: string // Optional: Name of service (e.g., "OpenAI", "Anthropic")
    analysisType: string    // E.g., "openRate", "copyAnalysis"
    findings: Record<string, any>
    recommendations?: Record<string, any>
    analyzedAt: Date

    // Relations
    integration: IntegrationConfig
  }
}


// Common Prisma Include Types
export type FullUserProfile = Prisma.UserGetPayload<{
  include: {
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
    organization: true
    accounts: true
    authenticatorApp: true
    comments: true
    favorites: true
    feedback: true
    notes: true
    notifications: true
    pageVisits: true
    sessions: true
  }
}>

export type CompleteFunnel = Prisma.FunnelDefinitionGetPayload<{
  include: {
    milestones: true
    prerequisites: {
      include: {
        prerequisiteFunnel: true
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

export type FullConversation = Prisma.UserConversationGetPayload<{
  include: {
    messages: true
    analysis: true
    user: {
      include: {
        teamMembers: true
      }
    }
  }
}>

export type CompleteScrapeJob = Prisma.WebsiteScrapeJobGetPayload<{
  include: {
    pages: true
    progress: {
      orderBy: {
        timestamp: 'desc'
      }
      take: 1
    }
    team: true
    user: true
  }
}>

// Utility Types
export type Without<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>
export type Optional<T, K extends keyof T> = Without<T, K> & Partial<Pick<T, K>>


// Query Types
export interface QueryOptions {
  include?: Record<string, boolean | Record<string, any>>
  where?: Record<string, any>
  orderBy?: Record<string, 'asc' | 'desc'>
  take?: number
  skip?: number
}