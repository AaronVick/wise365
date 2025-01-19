// src/services/routing/implementations/not-diamond.service.ts
/**
 * Not Diamond Service Implementation
 * 
 * Implements INotDiamondService for integration with Not Diamond's API.
 * Handles API communication, error handling, and response parsing.
 * 
 * @packageDocumentation
 */

import { INotDiamondService, NotDiamondResponse } from '../interfaces/not-diamond.interface'
import { NotDiamondError } from '../validation/error-types'
import { RoutingManagement } from '../../../types/global'

export class NotDiamondService implements INotDiamondService {
  constructor(
    private apiKey: string,
    private apiEndpoint: string
  ) {}

  async analyzeContent(content: string, taskType: RoutingManagement.TaskType): Promise<NotDiamondResponse> {
    try {
      const response = await fetch(`${this.apiEndpoint}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          content,
          taskType,
          options: {
            includeReasoning: true,
            includeAlternatives: true
          }
        })
      })

      if (!response.ok) {
        throw new Error(`Not Diamond API returned status ${response.status}`)
      }

      const data = await response.json()

      // Validate response structure
      if (!data.provider || !data.model || typeof data.confidence !== 'number') {
        throw new Error('Invalid response structure from Not Diamond API')
      }

      return {
        provider: data.provider,
        model: data.model,
        confidence: data.confidence,
        reasoning: data.reasoning,
        alternatives: data.alternatives
      }
    } catch (error) {
      throw new NotDiamondError('Failed to analyze content with Not Diamond', {
        originalError: error,
        taskType
      })
    }
  }

  async getModelCapabilities(provider: string, model: string): Promise<RoutingManagement.RouterConfig['capabilities']> {
    try {
      const response = await fetch(`${this.apiEndpoint}/capabilities`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        params: {
          provider,
          model
        }
      })

      if (!response.ok) {
        throw new Error(`Not Diamond API returned status ${response.status}`)
      }

      const data = await response.json()

      // Validate and transform capabilities data
      return {
        supportedTasks: data.supported_tasks || [],
        maxTokens: data.max_tokens,
        contextWindow: data.context_window,
        specialFeatures: data.special_features || [],
        ...data.additional_capabilities
      }
    } catch (error) {
      throw new NotDiamondError('Failed to get model capabilities', {
        originalError: error,
        provider,
        model
      })
    }
  }

  async reportOutcome(routingId: string, performance: RoutingManagement.RoutingHistory['performance']): Promise<void> {
    try {
      const response = await fetch(`${this.apiEndpoint}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          routingId,
          performance
        })
      })

      if (!response.ok) {
        throw new Error(`Not Diamond API returned status ${response.status}`)
      }
    } catch (error) {
      throw new NotDiamondError('Failed to report routing outcome', {
        originalError: error,
        routingId
      })
    }
  }
}