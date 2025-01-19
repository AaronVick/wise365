// src/services/intelligence/cross-funnel.service.ts
/**
 * Cross-Funnel Intelligence Service
 * 
 * Analyzes relationships between funnels and optimizes user journeys by:
 * - Identifying patterns across funnel progressions
 * - Detecting dependencies between milestones
 * - Optimizing funnel sequences
 * - Discovering successful user paths
 * - Predicting potential blockers
 * 
 * Dependencies:
 * - src/services/insights/user-insight-aggregation.service.ts
 * - src/services/rag/rag-context.service.ts
 * - src/lib/llm/llm-client.ts
 * - src/utils/logger.ts
 * - src/lib/prisma.ts
 */

import { PrismaClient } from '@prisma/client'
import { LLMClient } from '../../lib/llm/llm-client'
import { userInsightAggregationService } from '../insights/user-insight-aggregation.service'
import { ragContextService } from '../rag/rag-context.service'
import { logger } from '../../utils/logger'

interface CrossFunnelAnalysis {
  patterns: FunnelPattern[]
  dependencies: FunnelDependency[]
  recommendations: FunnelRecommendation[]
  optimizations: PathOptimization[]
  risks: PotentialRisk[]
  metadata: AnalysisMetadata
}

interface FunnelPattern {
  type: 'sequence' | 'parallel' | 'conditional'
  funnels: string[]
  successRate: number
  averageCompletionTime: number
  commonBlockers: string[]
  prerequisites: Record<string, any>
}

interface FunnelDependency {
  sourceFunnel: string
  targetFunnel: string
  dependencyType: 'hard' | 'soft' | 'recommended'
  dataPoints: string[]
  impact: number
  confidence: number
}

class CrossFunnelIntelligenceService {
  private prisma: PrismaClient
  private llmClient: LLMClient

  constructor() {
    this.prisma = new PrismaClient()
    this.llmClient = new LLMClient()
  }

  /**
   * Analyzes patterns and relationships across all funnels
   * for a specific tenant or user
   */
  async analyzeCrossFunnelPatterns(
    tenantId: string,
    userId?: string,
    options: {
      timeframe?: number
      minConfidence?: number
      includeHistoricalData?: boolean
    } = {}
  ): Promise<CrossFunnelAnalysis> {
    try {
      logger.info('Starting cross-funnel analysis', { tenantId, userId })

      // Gather funnel progression data
      const funnelData = await this.gatherFunnelData(tenantId, userId, options)

      // Identify patterns and relationships
      const patterns = await this.identifyFunnelPatterns(funnelData)
      const dependencies = await this.analyzeFunnelDependencies(funnelData)

      // Generate recommendations and optimizations
      const recommendations = await this.generateFunnelRecommendations(
        patterns,
        dependencies
      )
      const optimizations = await this.identifyPathOptimizations(
        patterns,
        dependencies
      )

      // Assess potential risks
      const risks = await this.assessPotentialRisks(
        patterns,
        dependencies,
        optimizations
      )

      // Calculate metadata
      const metadata = this.calculateAnalysisMetadata({
        patterns,
        dependencies,
        recommendations,
        optimizations,
        risks
      })

      // Store analysis results
      await this.storeAnalysisResults({
        tenantId,
        userId,
        patterns,
        dependencies,
        recommendations,
        optimizations,
        risks,
        metadata
      })

      return {
        patterns,
        dependencies,
        recommendations,
        optimizations,
        risks,
        metadata
      }

    } catch (error) {
      logger.error('Cross-funnel analysis failed:', error)
      throw error
    }
  }

  /**
   * Identifies potential optimization opportunities across funnels
   */
  async identifyOptimizationOpportunities(
    tenantId: string,
    currentFunnelId: string
  ) {
    const funnelDefinition = await this.prisma.funnelDefinition.findUnique({
      where: { id: currentFunnelId },
      include: {
        milestones: true,
        prerequisites: true,
        progress: {
          include: {
            milestones: true,
            dataPoints: true
          }
        }
      }
    })

    // Analyze related funnels
    const relatedFunnels = await this.findRelatedFunnels(currentFunnelId)
    const opportunities = await this.analyzeOptimizationOpportunities(
      funnelDefinition,
      relatedFunnels
    )

    return opportunities
  }

  /**
   * Predicts potential blockers based on historical patterns
   */
  async predictPotentialBlockers(
    tenantId: string,
    userId: string,
    funnelId: string
  ) {
    // Get user's current context
    const userContext = await userInsightAggregationService.generateUserInsights(
      tenantId,
      userId
    )

    // Analyze historical patterns
    const historicalPatterns = await this.getHistoricalPatterns(funnelId)

    // Predict blockers
    return this.predictBlockers(userContext, historicalPatterns)
  }

  /**
   * Suggests optimal funnel sequences based on user profile
   */
  async suggestOptimalSequence(
    tenantId: string,
    userId: string,
    startFunnelId: string
  ) {
    // Get user insights
    const userInsights = await userInsightAggregationService.generateUserInsights(
      tenantId,
      userId
    )

    // Get available funnels
    const availableFunnels = await this.getAvailableFunnels(tenantId)

    // Calculate optimal sequence
    return this.calculateOptimalSequence(
      startFunnelId,
      availableFunnels,
      userInsights
    )
  }

  /**
   * Gathers and processes funnel progression data
   */
  private async gatherFunnelData(
    tenantId: string,
    userId?: string,
    options?: any
  ) {
    const whereClause: any = {
      tenantId,
      ...(userId && { userId }),
      ...(options?.timeframe && {
        startedAt: {
          gte: new Date(Date.now() - options.timeframe * 24 * 60 * 60 * 1000)
        }
      })
    }

    const funnelProgress = await this.prisma.funnelProgress.findMany({
      where: whereClause,
      include: {
        funnel: {
          include: {
            milestones: true,
            prerequisites: true
          }
        },
        milestones: {
          include: {
            validationResults: true
          }
        },
        dataPoints: true,
        analysis: true
      }
    })

    return this.processFunnelData(funnelProgress)
  }

  /**
   * Identifies patterns in funnel progression data
   */
  private async identifyFunnelPatterns(funnelData: any) {
    // Prepare data for analysis
    const analysisPrompt = this.prepareFunnelAnalysisPrompt(funnelData)

    // Use LLM to identify patterns
    const patternAnalysis = await this.llmClient.analyze(
      'default',
      'default',
      JSON.stringify(analysisPrompt)
    )

    return this.processFunnelPatterns(patternAnalysis)
  }

  /**
   * Analyzes dependencies between different funnels
   */
  private async analyzeFunnelDependencies(funnelData: any) {
    const dependencies = await Promise.all(
      funnelData.map(async (funnel: any) => {
        const directDependencies = await this.findDirectDependencies(funnel)
        const inferredDependencies = await this.findInferredDependencies(funnel)
        
        return [...directDependencies, ...inferredDependencies]
      })
    )

    return this.validateAndRankDependencies(dependencies.flat())
  }

  /**
   * Generates recommendations for funnel optimization
   */
  private async generateFunnelRecommendations(
    patterns: any[],
    dependencies: any[]
  ) {
    const recommendationContext = {
      patterns,
      dependencies,
      successMetrics: await this.getSuccessMetrics()
    }

    const recommendations = await this.llmClient.analyze(
      'default',
      'default',
      JSON.stringify(recommendationContext)
    )

    return this.processRecommendations(recommendations)
  }

  /**
   * Identifies potential optimizations in user paths
   */
  private async identifyPathOptimizations(
    patterns: any[],
    dependencies: any[]
  ) {
    // Analyze successful paths
    const successfulPaths = await this.analyzeSuccessfulPaths()

    // Identify bottlenecks
    const bottlenecks = await this.identifyBottlenecks(patterns, dependencies)

    // Generate optimization suggestions
    return this.generateOptimizations(successfulPaths, bottlenecks)
  }

  /**
   * Assesses potential risks in funnel transitions
   */
  private async assessPotentialRisks(
    patterns: any[],
    dependencies: any[],
    optimizations: any[]
  ) {
    const riskContext = {
      patterns,
      dependencies,
      optimizations,
      historicalIssues: await this.getHistoricalIssues()
    }

    const riskAnalysis = await this.llmClient.analyze(
      'default',
      'default',
      JSON.stringify(riskContext)
    )

    return this.processRiskAnalysis(riskAnalysis)
  }

  /**
   * Stores analysis results for future reference
   */
  private async storeAnalysisResults(results: any) {
    await this.prisma.crossFunnelAnalysis.create({
      data: {
        tenantId: results.tenantId,
        userId: results.userId,
        patterns: results.patterns,
        dependencies: results.dependencies,
        recommendations: results.recommendations,
        optimizations: results.optimizations,
        risks: results.risks,
        metadata: results.metadata,
        timestamp: new Date()
      }
    })
  }
}

export const crossFunnelIntelligenceService = new CrossFunnelIntelligenceService()