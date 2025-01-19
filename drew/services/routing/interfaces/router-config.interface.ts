// src/services/routing/interfaces/router-config.interface.ts
/**
 * Router Configuration Service Interface
 * 
 * Manages the core routing configurations that determine how different task types
 * are handled by various LLM providers. Provides CRUD operations and lookup methods
 * for router configurations.
 * 
 * @packageDocumentation
 */

import { RoutingManagement } from '../../../types/global'

export interface IRouterConfigService {
  create(config: Omit<RoutingManagement.RouterConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<RoutingManagement.RouterConfig>
  update(id: string, config: Partial<RoutingManagement.RouterConfig>): Promise<RoutingManagement.RouterConfig>
  delete(id: string): Promise<void>
  findById(id: string): Promise<RoutingManagement.RouterConfig | null>
  findByTaskType(taskType: RoutingManagement.TaskType): Promise<RoutingManagement.RouterConfig[]>
  getDefaultConfig(taskType: RoutingManagement.TaskType): Promise<RoutingManagement.RouterConfig | null>
}