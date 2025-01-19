// src/lib/api-middleware/index.ts
/**
 * API Middleware Functions
 * 
 * Middleware for handling authentication, authorization, validation,
 * and common API functionality for the routing system.
 * 
 * @packageDocumentation
 */

import { NextApiHandler, NextApiRequest, NextApiResponse } from 'next'
import { getSession } from 'next-auth/react'
import { z } from 'zod'
import { ValidationError } from '../../services/routing/validation/error-types'
import { prisma } from '../prisma'

interface ExtendedNextApiRequest extends NextApiRequest {
  user?: {
    id: string
    tenantId: string
    role: string
  }
}

// Validate request data against a Zod schema
export async function validateRequest<T>(data: unknown, schema: z.ZodType<T>): Promise<T> {
  try {
    return await schema.parseAsync(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid request data', {
        validationErrors: error.errors
      })
    }
    throw error
  }
}

// Authentication middleware
export function withAuth(handler: NextApiHandler) {
  return async (req: ExtendedNextApiRequest, res: NextApiResponse) => {
    try {
      const session = await getSession({ req })
      
      if (!session || !session.user) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      // Get user details from database
      const user = await prisma.user.findUnique({
        where: { email: session.user.email! },
        select: {
          id: true,
          tenantId: true,
          role: true
        }
      })

      if (!user) {
        return res.status(401).json({ error: 'User not found' })
      }

      // Attach user to request
      req.user = user
      
      return handler(req, res)
    } catch (error) {
      console.error('Authentication error:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }
}

// Admin authorization middleware
export function withAdmin(handler: NextApiHandler) {
  return async (req: ExtendedNextApiRequest, res: NextApiResponse) => {
    try {
      const session = await getSession({ req })
      
      if (!session || !session.user) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      // Get user details and verify admin role
      const user = await prisma.user.findUnique({
        where: { email: session.user.email! },
        select: {
          id: true,
          tenantId: true,
          role: true
        }
      })

      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: Admin access required' })
      }

      // Attach user to request
      req.user = user
      
      return handler(req, res)
    } catch (error) {
      console.error('Admin authorization error:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }
}

// Rate limiting middleware
export function withRateLimit(
  limit: number,
  windowMs: number = 60000 // 1 minute default
) {
  const requests = new Map<string, number[]>()

  return function rateLimit(handler: NextApiHandler) {
    return async (req: ExtendedNextApiRequest, res: NextApiResponse) => {
      const key = req.user?.id || req.headers['x-forwarded-for'] as string || 'anonymous'
      const now = Date.now()
      
      // Get existing requests for this key
      const timestamps = requests.get(key) || []
      
      // Remove old timestamps
      const validTimestamps = timestamps.filter(time => now - time < windowMs)
      
      if (validTimestamps.length >= limit) {
        return res.status(429).json({
          error: 'Too many requests',
          retryAfter: Math.ceil((validTimestamps[0] + windowMs - now) / 1000)
        })
      }

      // Add current request timestamp
      validTimestamps.push(now)
      requests.set(key, validTimestamps)

      return handler(req, res)
    }
  }
}

// Error handling middleware
export function withErrorHandler(handler: NextApiHandler) {
  return async (req: ExtendedNextApiRequest, res: NextApiResponse) => {
    try {
      return await handler(req, res)
    } catch (error) {
      console.error('API Error:', error)
      
      if (error instanceof ValidationError) {
        return res.status(400).json({
          error: error.message,
          details: error.details
        })
      }

      if (error instanceof Error) {
        return res.status(500).json({
          error: 'Internal server error',
          message: process.env.NODE_ENV === 'development' ? error.message : undefined
        })
      }

      return res.status(500).json({ error: 'Internal server error' })
    }
  }
}

// Combine multiple middleware functions
export function withMiddleware(...middleware: Array<(handler: NextApiHandler) => NextApiHandler>) {
  return (handler: NextApiHandler) => {
    return middleware.reduceRight((acc, mid) => mid(acc), handler)
  }
}