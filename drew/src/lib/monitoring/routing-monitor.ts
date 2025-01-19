// src/lib/monitoring/routing-monitor.ts
/**
 * Routing System Monitor
 * 
 * Monitors routing system health, performance, and error rates.
 * Provides alerting and logging for system issues.
 * 
 * @packageDocumentation
 */

import { prisma } from '../prisma'
import { logger } from '../logger'

interface RoutingDecision {
  conversationId: string
  messageId: string
  routing: {
    provider: string
    model: string
    reasoning: string
  }
  notDiamondSuggestion?: any
  timestamp: Date
  success: boolean
  latency?: number
}

interface SystemHealth {
  healthy: boolean
  issues: string[]
  metrics: {
    errorRate: number
    averageLatency: number
    successRate: number
  }
}

export class RoutingMonitor {
  private static readonly ERROR_THRESHOLD = 0.1 // 10% error rate threshold
  private static readonly LATENCY_THRESHOLD = 5000 // 5 seconds
  private static readonly MONITORING_WINDOW = 3600000 // 1 hour in milliseconds

  static async logRoutingDecision(data: RoutingDecision): Promise<void> {
    try {
      // Log to database
      await prisma.routingHistory.create({
        data: {
          conversationId: data.conversationId,
          messageId: data.messageId,
          actualRoute: data.routing,
          notDiamondRoute: data.notDiamondSuggestion || null,
          timestamp: data.timestamp,
          performance: {
            success: data.success,
            latency: data.latency || 0
          }
        }
      })

      // Log to monitoring system
      logger.info('Routing decision', {
        type: 'routing_decision',
        ...data
      })
    } catch (error) {
      logger.error('Failed to log routing decision', {
        type: 'monitoring_error',
        error,
        data
      })
    }
  }

  static async logRoutingError(error: Error, context: any): Promise<void> {
    try {
      // Log to error tracking system
      logger.error('Routing error', {
        type: 'routing_error',
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        },
        context
      })

      // Store error in database for analysis
      await prisma.routingError.create({
        data: {
          errorType: error.name,
          message: error.message,
          context: context,
          timestamp: new Date()
        }
      })
    } catch (logError) {
      logger.error('Failed to log routing error', {
        type: 'monitoring_error',
        error: logError,
        originalError: error
      })
    }
  }

  static async checkSystemHealth(): Promise<SystemHealth> {
    try {
      const startTime = new Date(Date.now() - this.MONITORING_WINDOW)
      
      // Get recent routing history
      const recentHistory = await prisma.routingHistory.findMany({
        where: {
          timestamp: {
            gte: startTime
          }
        }
      })

      // Calculate metrics
      const totalRequests = recentHistory.length
      const errors = await prisma.routingError.count({
        where: {
          timestamp: {
            gte: startTime
          }
        }
      })

      const metrics = {
        errorRate: totalRequests ? errors / totalRequests : 0,
        averageLatency: totalRequests ? 
          recentHistory.reduce((acc, r) => acc + (r.performance.latency || 0), 0) / totalRequests : 
          0,
        successRate: totalRequests ?
          recentHistory.filter(r => r.performance.success).length / totalRequests : 
          1
      }

      // Identify issues
      const issues: string[] = []
      
      if (metrics.errorRate > this.ERROR_THRESHOLD) {
        issues.push(`High error rate: ${(metrics.errorRate * 100).toFixed(1)}%`)
      }
      
      if (metrics.averageLatency > this.LATENCY_THRESHOLD) {
        issues.push(`High average latency: ${metrics.averageLatency.toFixed(0)}ms`)
      }

      if (metrics.successRate < 0.9) {
        issues.push(`Low success rate: ${(metrics.successRate * 100).toFixed(1)}%`)
      }

      return {
        healthy: issues.length === 0,
        issues,
        metrics
      }
    } catch (error) {
      logger.error('Health check failed', {
        type: 'monitoring_error',
        error
      })

      return {
        healthy: false,
        issues: ['Failed to perform health check'],
        metrics: {
          errorRate: 1,
          averageLatency: 0,
          successRate: 0
        }
      }
    }
  }
}