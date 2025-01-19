// src/services/routing/implementations/routing-history.service.ts
/**
 * Routing History Service Implementation
 * 
 * Manages the storage and retrieval of routing decisions and their outcomes.
 * Provides analytics and reporting capabilities for routing performance.
 * 
 * @packageDocumentation
 */

import { PrismaClient } from '@prisma/client'
import { IRoutingHistoryService } from '../interfaces/routing-history.interface'
import { RoutingManagement } from '../../../types/global'
import { RoutingError } from '../validation/error-types'

export class RoutingHistoryService implements IRoutingHistoryService {
  constructor(private prisma: PrismaClient) {}

  async create(history: Omit<RoutingManagement.RoutingHistory, 'id' | 'createdAt'>): Promise<RoutingManagement.RoutingHistory> {
    try {
      const record = await this.prisma.routingHistory.create({
        data: {
          conversationId: history.conversationId,
          messageId: history.messageId,
          notDiamondRoute: history.notDiamondRoute,
          actualRoute: history.actualRoute,
          reason: history.reason,
          performance: history.performance
        }
      })

      return record as RoutingManagement.RoutingHistory
    } catch (error) {
      throw new RoutingError('Failed to create routing history', 'HISTORY_ERROR', { error })
    }
  }

  async findByConversationId(conversationId: string): Promise<RoutingManagement.RoutingHistory[]> {
    try {
      const records = await this.prisma.routingHistory.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' }
      })

      return records as RoutingManagement.RoutingHistory[]
    } catch (error) {
      throw new RoutingError('Failed to find routing history', 'HISTORY_ERROR', {
        conversationId,
        error
      })
    }
  }

  async findByMessageId(messageId: string): Promise<RoutingManagement.RoutingHistory | null> {
    try {
      const record = await this.prisma.routingHistory.findUnique({
        where: { messageId }
      })

      return record as RoutingManagement.RoutingHistory | null
    } catch (error) {
      throw new RoutingError('Failed to find routing history', 'HISTORY_ERROR', {
        messageId,
        error
      })
    }
  }

  async getAnalytics(startDate: Date, endDate: Date): Promise<RoutingManagement.RoutingAnalytics> {
    try {
      // Get all records within date range
      const records = await this.prisma.routingHistory.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      })

      // Calculate analytics
      const totalRequests = records.length
      const successfulRequests = records.filter(r => r.performance.success).length
      const averageLatency = records.reduce((acc, r) => acc + r.performance.latency, 0) / totalRequests

      // Calculate cost breakdown by provider
      const costBreakdown = records.reduce((acc, r) => {
        const provider = r.actualRoute.provider
        acc[provider] = (acc[provider] || 0) + (r.performance.cost || 0)
        return acc
      }, {} as Record<string, number>)

      // Calculate routing distribution
      const routingDistribution = records.reduce((acc, r) => {
        const taskType = r.actualRoute.taskType
        const provider = r.actualRoute.provider
        
        if (!acc[taskType]) {
          acc[taskType] = {}
        }
        
        acc[taskType][provider] = (acc[taskType][provider] || 0) + 1
        return acc
      }, {} as Record<string, Record<string, number>>)

      return {
        totalRequests,
        successRate: (successfulRequests / totalRequests) * 100,
        averageLatency,
        costBreakdown,
        routingDistribution
      }
    } catch (error) {
      throw new RoutingError('Failed to generate analytics', 'ANALYTICS_ERROR', {
        startDate,
        endDate,
        error
      })
    }
  }
}