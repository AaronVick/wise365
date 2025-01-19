// src/services/routing/implementations/router-config.service.ts
/**
 * Router Configuration Service Implementation
 * 
 * Implements IRouterConfigService using Prisma for database operations.
 * Manages the lifecycle of router configurations including creation, updates,
 * and lookups.
 * 
 * @packageDocumentation
 */

import { PrismaClient } from '@prisma/client'
import { IRouterConfigService } from '../interfaces/router-config.interface'
import { ConfigurationError } from '../validation/error-types'
import { RoutingManagement } from '../../../types/global'

export class RouterConfigService implements IRouterConfigService {
  constructor(private prisma: PrismaClient) {}

  async create(config: Omit<RoutingManagement.RouterConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<RoutingManagement.RouterConfig> {
    try {
      // Check if a default config already exists for this task type
      if (config.isDefault) {
        const existingDefault = await this.prisma.routerConfig.findFirst({
          where: {
            taskType: config.taskType,
            isDefault: true
          }
        })

        if (existingDefault) {
          throw new ConfigurationError('Default configuration already exists for this task type', {
            taskType: config.taskType,
            existingId: existingDefault.id
          })
        }
      }

      // Create the new configuration
      const newConfig = await this.prisma.routerConfig.create({
        data: {
          taskType: config.taskType,
          priority: config.priority,
          provider: config.provider,
          model: config.model,
          isDefault: config.isDefault,
          cost: config.cost,
          capabilities: config.capabilities,
          metadata: config.metadata || {}
        }
      })

      return newConfig as RoutingManagement.RouterConfig
    } catch (error) {
      if (error instanceof ConfigurationError) throw error
      throw new ConfigurationError('Failed to create router configuration', {
        originalError: error,
        config
      })
    }
  }

  async update(id: string, config: Partial<RoutingManagement.RouterConfig>): Promise<RoutingManagement.RouterConfig> {
    try {
      const existingConfig = await this.prisma.routerConfig.findUnique({
        where: { id }
      })

      if (!existingConfig) {
        throw new ConfigurationError('Router configuration not found', { id })
      }

      // If updating isDefault to true, check for existing default
      if (config.isDefault) {
        const existingDefault = await this.prisma.routerConfig.findFirst({
          where: {
            taskType: config.taskType || existingConfig.taskType,
            isDefault: true,
            id: { not: id }
          }
        })

        if (existingDefault) {
          throw new ConfigurationError('Default configuration already exists for this task type', {
            taskType: config.taskType || existingConfig.taskType,
            existingId: existingDefault.id
          })
        }
      }

      const updatedConfig = await this.prisma.routerConfig.update({
        where: { id },
        data: config
      })

      return updatedConfig as RoutingManagement.RouterConfig
    } catch (error) {
      if (error instanceof ConfigurationError) throw error
      throw new ConfigurationError('Failed to update router configuration', {
        originalError: error,
        id,
        config
      })
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const config = await this.prisma.routerConfig.findUnique({
        where: { id }
      })

      if (!config) {
        throw new ConfigurationError('Router configuration not found', { id })
      }

      await this.prisma.routerConfig.delete({
        where: { id }
      })
    } catch (error) {
      if (error instanceof ConfigurationError) throw error
      throw new ConfigurationError('Failed to delete router configuration', {
        originalError: error,
        id
      })
    }
  }

  async findById(id: string): Promise<RoutingManagement.RouterConfig | null> {
    try {
      const config = await this.prisma.routerConfig.findUnique({
        where: { id }
      })

      return config as RoutingManagement.RouterConfig | null
    } catch (error) {
      throw new ConfigurationError('Failed to find router configuration', {
        originalError: error,
        id
      })
    }
  }

  async findByTaskType(taskType: RoutingManagement.TaskType): Promise<RoutingManagement.RouterConfig[]> {
    try {
      const configs = await this.prisma.routerConfig.findMany({
        where: { taskType },
        orderBy: { priority: 'asc' }
      })

      return configs as RoutingManagement.RouterConfig[]
    } catch (error) {
      throw new ConfigurationError('Failed to find router configurations for task type', {
        originalError: error,
        taskType
      })
    }
  }

  async getDefaultConfig(taskType: RoutingManagement.TaskType): Promise<RoutingManagement.RouterConfig | null> {
    try {
      const config = await this.prisma.routerConfig.findFirst({
        where: {
          taskType,
          isDefault: true
        }
      })

      return config as RoutingManagement.RouterConfig | null
    } catch (error) {
      throw new ConfigurationError('Failed to find default router configuration', {
        originalError: error,
        taskType
      })
    }
  }
}