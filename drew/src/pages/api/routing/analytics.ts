// src/pages/api/routing/analytics.ts
/**
 * Routing Analytics API Endpoint
 * 
 * Provides analytics and performance metrics for routing decisions.
 * Supports filtering by date range, tenant, task types, and providers.
 * 
 * @endpoint GET /api/routing/analytics
 * @query {
 *   startDate: ISO date string
 *   endDate: ISO date string
 *   tenantId?: string
 *   taskTypes?: string[]
 *   providers?: string[]
 * }
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { AnalyticsQuerySchema } from '../../../services/routing/validation/api-types'
import { routingHistoryService } from '../../../services/routing'
import { validateRequest, withAuth } from '../../../lib/api-middleware'
import { ValidationError } from '../../../services/routing/validation/error-types'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Parse and validate query parameters
    const validatedQuery = await validateRequest({
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      tenantId: req.query.tenantId,
      taskTypes: req.query.taskTypes ? 
        Array.isArray(req.query.taskTypes) ? 
          req.query.taskTypes : 
          [req.query.taskTypes] : 
        undefined,
      providers: req.query.providers ?
        Array.isArray(req.query.providers) ?
          req.query.providers :
          [req.query.providers] :
        undefined
    }, AnalyticsQuerySchema)

    // Get analytics data
    const analytics = await routingHistoryService.getAnalytics(
      validatedQuery.startDate,
      validatedQuery.endDate,
      {
        tenantId: validatedQuery.tenantId,
        taskTypes: validatedQuery.taskTypes,
        providers: validatedQuery.providers
      }
    )

    // Format and aggregate the data
    const formattedAnalytics = {
      summary: {
        totalRequests: analytics.totalRequests,
        successRate: analytics.successRate,
        averageLatency: analytics.averageLatency
      },
      costBreakdown: analytics.costBreakdown,
      routingDistribution: analytics.routingDistribution,
      timeSeriesData: analytics.timeSeriesData || [],
      topPerformingRoutes: analytics.topPerformingRoutes || []
    }

    return res.status(200).json(formattedAnalytics)
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message, details: error.details })
    }
    console.error('Analytics error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default withAuth(handler)