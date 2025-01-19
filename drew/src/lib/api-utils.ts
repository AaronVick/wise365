// src/lib/api-utils.ts
/**
 * Shared API utilities
 * Common functions used across API endpoints
 * 
 * Dependencies:
 * - next: NextApiRequest type
 * 
 * This file provides common utility functions for API endpoints,
 * including pagination, sorting, filtering, and error handling.
 */

import { NextApiRequest } from 'next'

interface PaginationParams {
  page: number
  pageSize: number
}

interface SortParams {
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

/**
 * Extracts and validates pagination parameters from request
 * @param req - Next.js API request object
 * @param defaultPageSize - Optional default page size (default: 20)
 * @param maxPageSize - Optional maximum page size (default: 100)
 */
export function getPaginationParams(
  req: NextApiRequest,
  defaultPageSize = 20,
  maxPageSize = 100
): PaginationParams {
  const page = Math.max(1, parseInt(req.query.page as string) || 1)
  const requestedPageSize = parseInt(req.query.pageSize as string) || defaultPageSize
  const pageSize = Math.min(Math.max(1, requestedPageSize), maxPageSize)

  return { page, pageSize }
}

/**
 * Validates and extracts sorting parameters from request
 * @param req - Next.js API request object
 * @param allowedFields - Array of field names that can be used for sorting
 * @param defaultField - Default field to sort by
 */
export function getSortParams(
  req: NextApiRequest,
  allowedFields: string[],
  defaultField: string = allowedFields[0]
): SortParams {
  const requestedField = req.query.sortBy as string
  const sortOrder = req.query.sortOrder as 'asc' | 'desc'

  return {
    sortBy: allowedFields.includes(requestedField) ? requestedField : defaultField,
    sortOrder: sortOrder === 'asc' ? 'asc' : 'desc'
  }
}

/**
 * Extracts and validates filter parameters from request
 * @param req - Next.js API request object
 * @param allowedFilters - Array of allowed filter field names
 * @param validators - Optional object with validation functions for each filter
 */
export function getFilterParams(
  req: NextApiRequest,
  allowedFilters: string[],
  validators?: Record<string, (value: any) => boolean>
): Record<string, any> {
  const filters: Record<string, any> = {}

  for (const filter of allowedFilters) {
    const value = req.query[filter]
    if (value !== undefined) {
      // Apply validator if provided
      if (validators?.[filter]) {
        if (validators[filter](value)) {
          filters[filter] = value
        }
      } else {
        filters[filter] = value
      }
    }
  }

  return filters
}

/**
 * Formats error objects for consistent API responses
 * @param error - Error object or unknown error value
 * @param includeStack - Whether to include stack trace (default: false)
 */
export function formatError(
  error: unknown,
  includeStack = false
): { error: string; details?: any } {
  if (error instanceof Error) {
    return {
      error: error.message,
      ...(includeStack && process.env.NODE_ENV !== 'production' && {
        details: error.stack
      })
    }
  }
  return {
    error: 'An unknown error occurred'
  }
}

/**
 * Creates a database where clause for text search across multiple fields
 * @param searchTerm - Search term to look for
 * @param fields - Array of field names to search in
 */
export function createSearchQuery(
  searchTerm: string,
  fields: string[]
): Record<string, any> {
  if (!searchTerm) return {}

  return {
    OR: fields.map(field => ({
      [field]: {
        contains: searchTerm,
        mode: 'insensitive'
      }
    }))
  }
}

/**
 * Validates and sanitizes query parameters
 * @param params - Object containing query parameters
 * @param schema - Validation schema for parameters
 */
export function validateQueryParams(
  params: Record<string, any>,
  schema: Record<string, (value: any) => boolean>
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  for (const [key, validator] of Object.entries(schema)) {
    if (params[key] && !validator(params[key])) {
      errors.push(`Invalid value for parameter: ${key}`)
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Generates pagination metadata for API responses
 * @param total - Total number of items
 * @param page - Current page number
 * @param pageSize - Items per page
 */
export function getPaginationMetadata(
  total: number,
  page: number,
  pageSize: number
) {
  return {
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    hasMore: total > page * pageSize
  }
}

/**
 * Helper function to ensure API handler only accepts specific HTTP methods
 * @param handler - API route handler
 * @param allowedMethods - Array of allowed HTTP methods
 */
export function withAllowedMethods(
  handler: (req: NextApiRequest, res: any) => Promise<void>,
  allowedMethods: string[]
) {
  return async (req: NextApiRequest, res: any) => {
    if (!allowedMethods.includes(req.method || '')) {
      return res.status(405).json({
        error: `Method ${req.method} Not Allowed`,
        allowedMethods
      })
    }
    return handler(req, res)
  }
}