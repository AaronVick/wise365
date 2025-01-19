// src/pages/api/routing/analyze.ts
/**
 * Content Analysis API Endpoint
 * 
 * Handles requests for content analysis and routing recommendations.
 * Validates input, processes through Not Diamond, and returns optimal routing.
 * 
 * @endpoint POST /api/routing/analyze
 * @body {
 *   content: string
 *   taskType?: string
 *   tenantId: string
 *   conversationId?: string
 *   messageId?: string
 * }
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { AnalyzeContentSchema } from '../../../services/routing/validation/api-types'
import { routingAnalyzerService } from '../../../services/routing'
import { validateRequest } from '../../../lib/api-middleware'
import { RoutingError, ValidationError } from '../../../services/routing/validation/error-types'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Validate request body
    const validatedData = await validateRequest(req.body, AnalyzeContentSchema)

    // Get routing recommendation
    const result = await routingAnalyzerService.getOptimalRoute(
      validatedData.content,
      validatedData.taskType,
      validatedData.tenantId
    )

    // Track analysis in history if conversation context provided
    if (validatedData.conversationId && validatedData.messageId) {
      await routingAnalyzerService.trackAnalysis({
        conversationId: validatedData.conversationId,
        messageId: validatedData.messageId,
        result
      })
    }

    return res.status(200).json(result)
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message, details: error.details })
    }
    if (error instanceof RoutingError) {
      return res.status(422).json({ error: error.message, code: error.code })
    }
    console.error('Routing analysis error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}