// src/services/insights/user-insight-aggregation.service.ts
/**
 * User Insight Aggregation Service
 * 
 * Combines and analyzes data from multiple sources to create comprehensive
 * user profiles and insights. Sources include:
 * - Website analysis
 * - Conversation history
 * - Form submissions
 * - Progress patterns
 * - MSW assessments
 * - User behavior and engagement
 * 
 * Dependencies:
 * - src/services/rag/rag-context.service.ts: For contextual data
 * - src/services/adaptation/content-adaptation.service.ts: For content preferences
 * - src/lib/llm/llm-client.ts: For insight generation
 * - src/utils/logger.ts: Logging utility
 * - src/lib/prisma.ts: Database access
 */

import { PrismaClient } from '@prisma/client'
import { LLMClient } from '../../lib/llm/llm-client'
import { ragContextService } from '../rag/rag-context.service'
import { contentAdaptationService } from '../adaptation/content-adaptation.service'
import { logger } from '../../utils/logger'

interface InsightOptions {
  includeWebsiteInsights?: boolean
  includeConversationInsights?: boolean
  includeFunnelInsights?: boolean
  includeBehavioralInsights?: boolean
  maxInsightAge?: number // in days
  confidenceThreshold?: number
}

interface InsightResult {
  userId: string
  timestamp: Date
  profiles: {
    business: BusinessProfile
    engagement: EngagementProfile
    learning: LearningProfile
    behavioral: BehavioralProfile
  }
  insights: {
    key: string
    value: any
    confidence: number
    source: string
    timestamp: Date
  }[]
  recommendations: {
    type: string
    priority: number
    rationale: string
    actionable: boolean
  }[]
  metadata: {
    dataFreshness: Date
    confidenceScores: Record<string, number>
    sourceCoverage: string[]
  }
}

class UserInsightAggregationService {
  private prisma: PrismaClient
  private llmClient: LLMClient

  constructor() {
    this.prisma = new PrismaClient()
    this.llmClient = new LLMClient()
  }

  /**
   * Generates comprehensive user insights by aggregating multiple data sources
   */
  async generateUserInsights(
    tenantId: string,
    userId: string,
    options: InsightOptions = {}
  ): Promise<InsightResult> {
    try {
      logger.info('Starting user insight generation', { tenantId, userId })

      // Gather raw data from all sources
      const [
        websiteInsights,
        conversationInsights,
        funnelInsights,
        behavioralInsights
      ] = await Promise.all([
        this.gatherWebsiteInsights(tenantId, userId, options),
        this.gatherConversationInsights(userId, options),
        this.gatherFunnelInsights(tenantId, userId, options),
        this.gatherBehavioralInsights(userId, options)
      ])

      // Create profiles based on aggregated data
      const profiles = await this.createUserProfiles({
        websiteInsights,
        conversationInsights,
        funnelInsights,
        behavioralInsights
      })

      // Generate high-level insights
      const insights = await this.synthesizeInsights(profiles)

      // Generate actionable recommendations
      const recommendations = await this.generateRecommendations(profiles, insights)

      // Calculate metadata and confidence scores
      const metadata = this.calculateMetadata({
        profiles,
        insights,
        recommendations
      })

      // Store insights for future reference
      await this.storeInsights({
        tenantId,
        userId,
        profiles,
        insights,
        recommendations,
        metadata
      })

      return {
        userId,
        timestamp: new Date(),
        profiles,
        insights,
        recommendations,
        metadata
      }

    } catch (error) {
      logger.error('Error generating user insights:', error)
      throw error
    }
  }

  /**
   * Gathers insights from website analysis
   */
  private async gatherWebsiteInsights(
    tenantId: string,
    userId: string,
    options: InsightOptions
  ) {
    if (!options.includeWebsiteInsights) return null

    const websiteAnalysis = await this.prisma.websiteAnalysis.findMany({
      where: {
        scrapeJob: {
          tenantId,
          userId,
          status: 'completed'
        },
        status: 'completed',
        analyzedAt: {
          gte: new Date(Date.now() - (options.maxInsightAge || 90) * 24 * 60 * 60 * 1000)
        }
      },
      include: {
        page: true,
        model: true
      }
    })

    return this.processWebsiteInsights(websiteAnalysis)
  }

  /**
   * Gathers insights from conversation history
   */
  private async gatherConversationInsights(
    userId: string,
    options: InsightOptions
  ) {
    if (!options.includeConversationInsights) return null

    const conversations = await this.prisma.userConversation.findMany({
      where: {
        userId,
        lastMessage: {
          gte: new Date(Date.now() - (options.maxInsightAge || 90) * 24 * 60 * 60 * 1000)
        }
      },
      include: {
        messages: true,
        analysis: {
          where: {
            isRelevant: true
          }
        }
      }
    })

    return this.processConversationInsights(conversations)
  }

  /**
   * Gathers insights from funnel progress
   */
  private async gatherFunnelInsights(
    tenantId: string,
    userId: string,
    options: InsightOptions
  ) {
    if (!options.includeFunnelInsights) return null

    const funnelProgress = await this.prisma.funnelProgress.findMany({
      where: {
        tenantId,
        userId,
        lastActivity: {
          gte: new Date(Date.now() - (options.maxInsightAge || 90) * 24 * 60 * 60 * 1000)
        }
      },
      include: {
        milestones: true,
        dataPoints: true,
        analysis: true,
        assessments: true
      }
    })

    return this.processFunnelInsights(funnelProgress)
  }

  /**
   * Gathers behavioral insights from user activity
   */
  private async gatherBehavioralInsights(
    userId: string,
    options: InsightOptions
  ) {
    if (!options.includeBehavioralInsights) return null

    // Gather various behavioral indicators
    const [userActivity, formSubmissions, resourceUsage] = await Promise.all([
      this.getUserActivity(userId),
      this.getFormSubmissions(userId),
      this.getResourceUsage(userId)
    ])

    return this.processBehavioralInsights({
      userActivity,
      formSubmissions,
      resourceUsage
    })
  }

  /**
   * Creates comprehensive user profiles from gathered insights
   */
  private async createUserProfiles(data: any) {
    const profiles = {
      business: await this.createBusinessProfile(data),
      engagement: await this.createEngagementProfile(data),
      learning: await this.createLearningProfile(data),
      behavioral: await this.createBehavioralProfile(data)
    }

    return this.validateProfiles(profiles)
  }

  /**
   * Synthesizes high-level insights from profiles
   */
  private async synthesizeInsights(profiles: any) {
    const synthesisPrompt = {
      profiles,
      task: 'Generate key insights and patterns'
    }

    const synthesis = await this.llmClient.analyze(
      'default',
      'default',
      JSON.stringify(synthesisPrompt)
    )

    return this.processInsights(synthesis)
  }

  /**
   * Generates actionable recommendations based on insights
   */
  private async generateRecommendations(profiles: any, insights: any) {
    const recommendationPrompt = {
      profiles,
      insights,
      task: 'Generate actionable recommendations'
    }

    const recommendations = await this.llmClient.analyze(
      'default',
      'default',
      JSON.stringify(recommendationPrompt)
    )

    return this.processRecommendations(recommendations)
  }

  /**
   * Stores generated insights for future reference
   */
  private async storeInsights(data: any) {
    await this.prisma.userInsights.create({
      data: {
        tenantId: data.tenantId,
        userId: data.userId,
        profiles: data.profiles,
        insights: data.insights,
        recommendations: data.recommendations,
        metadata: data.metadata,
        timestamp: new Date()
      }
    })
  }
}

export const userInsightAggregationService = new UserInsightAggregationService()