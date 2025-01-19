// src/services/adaptation/content-adaptation.service.ts
/**
 * Content Adaptation Service
 * 
 * Dynamically adapts content, resources, and recommendations based on:
 * - User's industry and business type
 * - Progress level and historical engagement
 * - MSW scores and funnel position
 * - Website analysis insights
 * 
 * Dependencies:
 * - src/services/rag/rag-context.service.ts: For contextual data
 * - src/lib/llm/llm-client.ts: For content analysis and generation
 * - src/utils/logger.ts: Logging utility
 * - src/lib/prisma.ts: Database access
 * - src/types/global.d.ts: Type definitions
 */

import { PrismaClient } from '@prisma/client'
import { LLMClient } from '../../lib/llm/llm-client'
import { ragContextService } from '../rag/rag-context.service'
import { logger } from '../../utils/logger'

interface AdaptationConfig {
  industry: string
  businessSize: 'small' | 'medium' | 'large'
  targetAudience?: string[]
  mswScores?: Record<string, number>
  currentFunnel?: string
  adaptationLevel: 'basic' | 'moderate' | 'comprehensive'
}

interface AdaptationResult {
  originalContent: any
  adaptedContent: any
  adaptations: {
    type: string
    reason: string
    impact: string
  }[]
  metadata: {
    timestamp: Date
    configUsed: AdaptationConfig
    confidenceScore: number
  }
}

class ContentAdaptationService {
  private prisma: PrismaClient
  private llmClient: LLMClient

  constructor() {
    this.prisma = new PrismaClient()
    this.llmClient = new LLMClient()
  }

  /**
   * Main adaptation method for any content type
   * Uses RAG context and user profile to customize content
   */
  async adaptContent(
    tenantId: string,
    userId: string,
    content: any,
    config: AdaptationConfig
  ): Promise<AdaptationResult> {
    try {
      // Get enriched context
      const context = await ragContextService.generateContext(
        tenantId,
        userId,
        config.currentFunnel || ''
      )

      // Get user's industry patterns
      const industryPatterns = await this.getIndustryPatterns(config.industry)

      // Analyze content for adaptation opportunities
      const adaptationOpportunities = await this.analyzeForAdaptation(
        content,
        context,
        industryPatterns
      )

      // Apply adaptations based on configuration
      const adaptedContent = await this.applyAdaptations(
        content,
        adaptationOpportunities,
        config
      )

      // Store adaptation record for learning
      await this.recordAdaptation({
        tenantId,
        userId,
        originalContent: content,
        adaptedContent,
        config,
        context
      })

      return {
        originalContent: content,
        adaptedContent,
        adaptations: adaptationOpportunities,
        metadata: {
          timestamp: new Date(),
          configUsed: config,
          confidenceScore: this.calculateConfidenceScore(adaptationOpportunities)
        }
      }
    } catch (error) {
      logger.error('Content adaptation failed:', error)
      throw error
    }
  }

  /**
   * Adapts resources (templates, guides, forms) based on user context
   */
  async adaptResource(
    resourceId: string,
    tenantId: string,
    userId: string,
    config: AdaptationConfig
  ) {
    // Get original resource
    const resource = await this.prisma.resources.findUnique({
      where: { id: resourceId }
    })

    if (!resource) {
      throw new Error('Resource not found')
    }

    // Adapt based on resource type
    switch (resource.type) {
      case 'template':
        return this.adaptTemplate(resource, config)
      case 'guide':
        return this.adaptGuide(resource, config)
      case 'form':
        return this.adaptForm(resource, config)
      default:
        return resource
    }
  }

  /**
   * Analyzes content for potential adaptation points
   */
  private async analyzeForAdaptation(
    content: any,
    context: any,
    industryPatterns: any
  ) {
    // Prepare analysis prompt
    const analysisPrompt = {
      content,
      context,
      industryPatterns,
      task: 'Identify adaptation opportunities'
    }

    // Get LLM analysis
    const analysis = await this.llmClient.analyze(
      'default',
      'default',
      JSON.stringify(analysisPrompt)
    )

    return this.structureAdaptationOpportunities(analysis)
  }

  /**
   * Applies identified adaptations based on configuration level
   */
  private async applyAdaptations(
    content: any,
    opportunities: any[],
    config: AdaptationConfig
  ) {
    // Filter opportunities based on adaptation level
    const relevantOpportunities = this.filterByAdaptationLevel(
      opportunities,
      config.adaptationLevel
    )

    // Apply each adaptation
    let adaptedContent = { ...content }
    for (const opportunity of relevantOpportunities) {
      adaptedContent = await this.applySingleAdaptation(
        adaptedContent,
        opportunity,
        config
      )
    }

    return adaptedContent
  }

  /**
   * Gets industry-specific patterns and examples
   */
  private async getIndustryPatterns(industry: string) {
    const patterns = await this.prisma.industryPatterns.findFirst({
      where: { industry }
    })

    return patterns || await this.generateIndustryPatterns(industry)
  }

  /**
   * Records adaptation for future learning
   */
  private async recordAdaptation(data: any) {
    await this.prisma.contentAdaptation.create({
      data: {
        tenantId: data.tenantId,
        userId: data.userId,
        originalContent: data.originalContent,
        adaptedContent: data.adaptedContent,
        configuration: data.config,
        context: data.context,
        timestamp: new Date()
      }
    })
  }

  /**
   * Calculates confidence score for adaptations
   */
  private calculateConfidenceScore(adaptations: any[]): number {
    // Implementation depends on specific scoring criteria
    return adaptations.reduce((acc, curr) => acc + (curr.confidence || 0), 0) / adaptations.length
  }
}

export const contentAdaptationService = new ContentAdaptationService()