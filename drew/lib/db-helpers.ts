// lib/db-helpers.ts

/**
 * Common database helper functions
 * 
 * Provides reusable database operations and error handling utilities
 * for working with Prisma across the application.
 */

import { prisma } from './prisma'
import { PrismaError, TransactionClient } from '../types/prisma'

export class DatabaseError extends Error {
  constructor(
    message: string,
    public code?: string,
    public meta?: unknown
  ) {
    super(message)
    this.name = 'DatabaseError'
  }
}

export async function withTransaction<T>(
  callback: (tx: TransactionClient) => Promise<T>
): Promise<T> {
  try {
    return await prisma.$transaction(callback)
  } catch (error) {
    if (isPrismaError(error)) {
      throw new DatabaseError(
        error.message,
        error.code,
        error.meta
      )
    }
    throw error
  }
}

// Common query helpers
export const queryHelpers = {
  // Include user's team context
  withTeamContext: (userId: string) => ({
    teamMembers: {
      include: {
        team: true
      },
      where: {
        userId
      }
    }
  }),

  // Include funnel progress context
  withFunnelProgress: (userId: string, teamId?: string) => ({
    progress: {
      where: {
        OR: [
          { userId },
          { teamId: teamId || '' }
        ]
      },
      include: {
        milestones: true,
        dataPoints: true
      }
    }
  })
}

// Constants for common query includes
export const COMMON_INCLUDES = {
  FULL_USER: {
    teamMembers: {
      include: {
        team: true
      }
    },
    funnelProgress: {
      include: {
        milestones: true,
        dataPoints: true
      }
    }
  },
  
  FULL_FUNNEL: {
    milestones: true,
    prerequisites: true,
    dataPoints: true,
    requiredForms: true,
    triggers: true
  }
} as const