// src/pages/api/routing/config.ts
/**
 * Router Configuration API Endpoints
 * 
 * CRUD operations for router configurations. Protected by admin middleware.
 * 
 * @endpoints
 * GET    /api/routing/config
 * POST   /api/routing/config
 * PUT    /api/routing/config/:id
 * DELETE /api/routing/config/:id
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { RouterConfigSchema } from '../../../services/routing/validation/api-types'
import { routerConfigService } from '../../../services/routing'
import { validateRequest, withAdmin } from '../../../lib/api-middleware'
import { ConfigurationError, ValidationError } from '../../../services/routing/validation/error-types'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET': {
        const { taskType } = req.query
        if (taskType) {
          const configs = await routerConfigService.findByTaskType(taskType as string)
          return res.status(200).json(configs)
        }
        const configs = await routerConfigService.findAll()
        return res.status(200).json(configs)
      }

      case 'POST': {
        const validatedData = await validateRequest(req.body, RouterConfigSchema)
        const newConfig = await routerConfigService.create(validatedData)
        return res.status(201).json(newConfig)
      }

      case 'PUT': {
        const { id } = req.query
        if (!id || Array.isArray(id)) {
          throw new ValidationError('Invalid configuration ID')
        }
        const validatedData = await validateRequest(req.body, RouterConfigSchema.partial())
        const updatedConfig = await routerConfigService.update(id, validatedData)
        return res.status(200).json(updatedConfig)
      }

      case 'DELETE': {
        const { id } = req.query
        if (!id || Array.isArray(id)) {
          throw new ValidationError('Invalid configuration ID')
        }
        await routerConfigService.delete(id)
        return res.status(204).end()
      }

      default:
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message, details: error.details })
    }
    if (error instanceof ConfigurationError) {
      return res.status(422).json({ error: error.message, code: error.code })
    }
    console.error('Router configuration error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default withAdmin(handler)