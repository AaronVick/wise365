// src/services/routing/interfaces/not-diamond.interface.ts
/**
 * Not Diamond Integration Service Interface
 * 
 * Handles integration with Not Diamond's API for content analysis and routing
 * recommendations. Provides methods for analyzing content and reporting outcomes.
 * 
 * @packageDocumentation
 */

export interface NotDiamondResponse {
  provider: string
  model: string
  confidence: number
  reasoning?: string
  alternatives?: Array<{
    provider: string
    model: string
    confidence: number
  }>
}

export interface INotDiamondService {
  analyzeContent(content: string, taskType: RoutingManagement.TaskType): Promise<NotDiamondResponse>
  getModelCapabilities(provider: string, model: string): Promise<RoutingManagement.RouterConfig['capabilities']>
  reportOutcome(routingId: string, performance: RoutingManagement.RoutingHistory['performance']): Promise<void>
}