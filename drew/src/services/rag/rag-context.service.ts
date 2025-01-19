// src/services/rag/rag-context.service.ts
/**
 * RAG Context Service
 * 
 * Provides contextual data enrichment for agent interactions by analyzing
 * historical data across multiple sources. This service aggregates and 
 * processes information to enhance agent prompts with relevant context.
 * 
 * Dependencies:
 * - src/lib/llm/llm-client.ts: For LLM analysis
 * - src/utils/logger.ts: Logging utility
 * - src/lib/prisma.ts: Database access
 * - src/services/website-analysis.service.ts: Website analysis results
 * - src/types/global.d.ts: Type definitions
 */

import { PrismaClient } from '@prisma/client'
import { LLMClient } from '../../lib/llm/llm-client'
import { logger } from '../../utils/logger'

interface RAGOptions {
  maxHistoryItems?: number
  includeWebsiteData?: boolean
  includeFunnelData?: boolean
  includeConversations?: boolean
  contextWindowSize?: number
  relevanceThreshold?: number
}

class RAGContextService {
  private prisma: PrismaClient
  private llmClient: LLMClient

  constructor() {
    this.prisma = new PrismaClient()
    this.llmClient = new LLMClient()
  }

  /**
   * Generates enriched context for agent interactions
   * Combines multiple data sources based on relevance
   */
  async generateContext(
    tenantId: string,
    userId: string,
    currentFunnelId: string,
    options: RAGOptions = {}
  ) {
    try {
      // Default options with sensible defaults
      const {
        maxHistoryItems = 10,
        includeWebsiteData = true,
        includeFunnelData = true,
        includeConversations = true,
        contextWindowSize = 2000,
        relevanceThreshold = 0.7
      } = options

      // Gather context from different sources in parallel
      const [
        websiteContext,
        funnelContext,
        conversationContext
      ] = await Promise.all([
        includeWebsiteData ? this.getWebsiteContext(tenantId, userId) : null,
        includeFunnelData ? this.getFunnelContext(tenantId, userId, currentFunnelId) : null,
        includeConversations ? this.getConversationContext(userId, currentFunnelId) : null
      ])

      // Combine and rank context elements
      const combinedContext = await this.rankAndFilterContext({
        websiteContext,
        funnelContext,
        conversationContext,
        threshold: relevanceThreshold,
        maxTokens: contextWindowSize
      })

      return {
        context: combinedContext,
        metadata: {
          sources: {
            websiteData: Boolean(websiteContext),
            funnelData: Boolean(funnelContext),
            conversationData: Boolean(conversationContext)
          },
          timestamp: new Date(),
          relevanceScores: combinedContext.map(c => c.relevance)
        }
      }

    } catch (error) {
      logger.error('Error generating RAG context:', error)
      throw error
    }
  }

  /**
   * Retrieves relevant website analysis data
   * Includes key insights and recent analysis results
   */
  private async getWebsiteContext(tenantId: string, userId: string) {
    const websiteAnalysis = await this.prisma.websiteAnalysis.findMany({
      where: {
        scrapeJob: {
          tenantId,
          userId
        },
        status: 'completed'
      },
      orderBy: {
        analyzedAt: 'desc'
      },
      take: 5,
      include: {
        page: true
      }
    })

    return websiteAnalysis.map(analysis => ({
      type: 'website',
      content: analysis.analysis,
      timestamp: analysis.analyzedAt,
      metadata: {
        url: analysis.page.url,
        title: analysis.page.title
      }
    }))
  }

  /**
   * Gathers relevant funnel progress and milestone data
   * Includes recent achievements and blocking points
   */
  private async getFunnelContext(tenantId: string, userId: string, currentFunnelId: string) {
    // Get current funnel progress
    const funnelProgress = await this.prisma.funnelProgress.findMany({
      where: {
        tenantId,
        userId,
        OR: [
          { funnelId: currentFunnelId },
          { status: 'completed' }
        ]
      },
      include: {
        milestones: true,
        dataPoints: true,
        analysis: {
          orderBy: {
            timestamp: 'desc'
          },
          take: 1
        }
      }
    })

    // Transform into context format
    return funnelProgress.map(progress => ({
      type: 'funnel',
      content: {
        status: progress.status,
        completionPercentage: progress.completionPercentage,
        recentMilestones: progress.milestones,
        keyDataPoints: progress.dataPoints,
        latestAnalysis: progress.analysis[0]
      },
      timestamp: progress.lastActivity
    }))
  }

  /**
   * Retrieves relevant conversation history
   * Focuses on milestone-related interactions
   */
  private async getConversationContext(userId: string, currentFunnelId: string) {
    const conversations = await this.prisma.userConversation.findMany({
      where: {
        userId,
        funnelId: currentFunnelId
      },
      include: {
        messages: {
          orderBy: {
            timestamp: 'desc'
          },
          take: 10
        },
        analysis: {
          where: {
            isRelevant: true
          }
        }
      },
      orderBy: {
        lastMessage: 'desc'
      },
      take: 5
    })

    return conversations.map(conv => ({
      type: 'conversation',
      content: {
        messages: conv.messages,
        insights: conv.analysis
      },
      timestamp: conv.lastMessage
    }))
  }

  /**
   * Ranks and filters context elements based on relevance
   * Uses LLM to score relevance and optimize context window
   */
  private async rankAndFilterContext({
    websiteContext,
    funnelContext,
    conversationContext,
    threshold,
    maxTokens
  }: {
    websiteContext: any[]
    funnelContext: any[]
    conversationContext: any[]
    threshold: number
    maxTokens: number
  }) {
    // Combine all context elements
    const allContext = [
      ...(websiteContext || []),
      ...(funnelContext || []),
      ...(conversationContext || [])
    ]

    // Score relevance using LLM
    const scoredContext = await Promise.all(
      allContext.map(async context => {
        const relevance = await this.scoreRelevance(context)
        return { ...context, relevance }
      })
    )

    // Filter and sort by relevance
    return scoredContext
      .filter(context => context.relevance >= threshold)
      .sort((a, b) => b.relevance - a.relevance)
  }

  /**
   * Uses LLM to score context relevance
   * Considers recency, specificity, and relation to current context
   */
  private async scoreRelevance(context: any): Promise<number> {
    // Implementation will depend on specific LLM being used
    const relevanceScore = await this.llmClient.analyze(
      'default',
      'default',
      JSON.stringify(context)
    )

    return parseFloat(relevanceScore) || 0
  }
}

export const ragContextService = new RAGContextService()