// lib/prisma-errors.ts
/**
 * Prisma error handling utilities
 * 
 * Provides standardized error handling and error messages for
 * common Prisma operations across the application.
 */

export const PRISMA_ERROR_CODES = {
  UNIQUE_CONSTRAINT: 'P2002',
  FOREIGN_KEY_CONSTRAINT: 'P2003',
  NOT_FOUND: 'P2001',
  REQUIRED_FIELD: 'P2011'
} as const

export function handlePrismaError(error: unknown): never {
  if (!isPrismaError(error)) {
    throw error
  }

  switch (error.code) {
    case PRISMA_ERROR_CODES.UNIQUE_CONSTRAINT:
      throw new DatabaseError(
        'A record with this value already exists',
        error.code,
        error.meta
      )
    
    case PRISMA_ERROR_CODES.FOREIGN_KEY_CONSTRAINT:
      throw new DatabaseError(
        'Referenced record does not exist',
        error.code,
        error.meta
      )
    
    case PRISMA_ERROR_CODES.NOT_FOUND:
      throw new DatabaseError(
        'Record not found',
        error.code,
        error.meta
      )
    
    default:
      throw new DatabaseError(
        'Database operation failed',
        error.code,
        error.meta
      )
  }
}