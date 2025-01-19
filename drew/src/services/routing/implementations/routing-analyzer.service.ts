// src/services/routing/implementations/routing-analyzer.service.ts
/**
 * Routing Analyzer Service Implementation
 * 
 * Analyzes content and determines optimal routing based on Not Diamond suggestions
 * and tenant preferences. Handles content type detection and routing decisions.
 * 
 * @packageDocumentation
 */

import { IRoutingAnalyzerService } from '../interfaces/routing-analyzer.interface'
import { NotDiamondService } from './not-diamond.service'
import { RouterConfigService } from './router-config.service'
import { RoutingManagement } from '../../../types/global'
import { NotDiamondResponse } from '../interfaces/not-diamond.interface'
import { RoutingError } from '../validation/error-types'
import { RoutingMonitor } from '../../../lib/monitoring/routing-monitor'

export class RoutingAnalyzerService implements IRoutingAnalyzerService {
  constructor(
    private notDiamondService: NotDiamondService,
    private routerConfigService: RouterConfigService
  ) {}

  async determineTaskType(content: string): Promise<RoutingManagement.TaskType> {
    try {
      // Use basic content analysis to determine type
      if (content.includes('<svg') || content.includes('data:image')) {
        return 'image'
      }
      
      if (content.match(/```[a-zA-Z]*/)) {
        return 'code'
      }

      // Check for markdown or HTML patterns
      if (content.match(/^#+\s|<\/?[a-z]+>/)) {
        return 'document'
      }

      // Check for summarization requests
      if (content.toLowerCase().includes('summarize') || content.toLowerCase().includes('summary')) {
        return 'summarization'
      }

      // Check for analysis requests
      if (content.toLowerCase().includes('analyze') || content.toLowerCase().includes('analysis')) {
        return 'analysis'
      }

      // Default to conversation for general content
      return 'conversation'
    } catch (error) {
      throw new RoutingError('Failed to determine task type', 'TASK_TYPE_ERROR', { content })
    }
  }

  async getOptimalRoute(
    content: string,
    taskType: RoutingManagement.TaskType,
    tenantId: string
  ): Promise<{
    notDiamondSuggestion: NotDiamondResponse,
    finalRoute: {
      provider: string,
      model: string,
      reasoning: string
    }
  }> {
    try {
      // Get Not Diamond's suggestion
      const notDiamondSuggestion = await this.notDiamondService.analyzeContent(
        content,
        taskType
      )

      // Get tenant-specific routing config
      const tenantConfig = await this.routerConfigService.findByTaskType(taskType)
      const defaultConfig = await this.routerConfigService.getDefaultConfig(taskType)

      // Determine final route based on suggestion and configs
      let finalRoute = {
        provider: notDiamondSuggestion.provider,
        model: notDiamondSuggestion.model,
        reasoning: `Selected based on Not Diamond suggestion with ${notDiamondSuggestion.confidence} confidence`
      }

      // Override with tenant config if available and higher priority
      if (tenantConfig.length > 0 && tenantConfig[0].priority > notDiamondSuggestion.confidence) {
        finalRoute = {
          provider: tenantConfig[0].provider,
          model: tenantConfig[0].model,
          reasoning: 'Selected based on tenant-specific routing configuration'
        }
      }

      // Fallback to default if needed
      if (!finalRoute.provider && defaultConfig) {
        finalRoute = {
          provider: defaultConfig.provider,
          model: defaultConfig.model,
          reasoning: 'Selected based on default routing configuration'
        }
      }

      return {
        notDiamondSuggestion,
        finalRoute
      }
    } catch (error) {
      throw new RoutingError('Failed to determine optimal route', 'ROUTING_ERROR', {
        taskType,
        tenantId,
        error
      })
    }
  }

  async trackAnalysis(data: {
    conversationId: string,
    messageId: string,
    result: any
  }): Promise<void> {
    try {
      await RoutingMonitor.logRoutingDecision({
        conversationId: data.conversationId,
        messageId: data.messageId,
        routing: data.result.finalRoute,
        notDiamondSuggestion: data.result.notDiamondSuggestion,
        timestamp: new Date(),
        success: true
      })
    } catch (error) {
      // Log but don't throw - tracking shouldn't block the main flow
      console.error('Failed to track routing analysis:', error)
    }
  }
}