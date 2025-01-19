// src/lib/api-utils/index.ts
/**
 * API Utility Functions
 * 
 * Common utility functions for API operations including response formatting,
 * pagination handling, and error processing.
 * 
 * @packageDocumentation
 */

import { NextApiResponse } from 'next'

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
  }
}

// Format success response
export function sendSuccess(
  res: NextApiResponse,
  data: any,
  status: number = 200
) {
  return res.status(status).json(data)
}

// Format error response
export function sendError(
  res: NextApiResponse,
  error: string | Error,
  status: number = 500,
  details?: any
) {
  const errorMessage = error instanceof Error ? error.message : error
  return res.status(status).json({
    error: errorMessage,
    details: details || undefined
  })
}

// Handle pagination parameters
export function getPaginationParams(query: any): PaginationParams {
  return {
    page: Math.max(1, parseInt(query.page as string) || 1),
    limit: Math.min(100, Math.max(1, parseInt(query.limit as string) || 10)),
    sortBy: query.sortBy as string,
    sortOrder: (query.sortOrder as 'asc' | 'desc') || 'desc'
  }
}

// Format paginated response
export function formatPaginatedResponse<T>(
  data: T[],
  totalItems: number,
  params: PaginationParams
): PaginatedResponse<T> {
  const { page = 1, limit = 10 } = params
  return {
    data,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalItems / limit),
      totalItems,
      itemsPerPage: limit
    }
  }
}

// Parse query parameters
export function parseQueryParams(query: any) {
  const parsedQuery: Record<string, any> = {}
  
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === '') return
    
    if (value === 'true') parsedQuery[key] = true
    else if (value === 'false') parsedQuery[key] = false
    else if (!isNaN(Number(value))) parsedQuery[key] = Number(value)
    else if (Array.isArray(value)) parsedQuery[key] = value
    else parsedQuery[key] = value
  })

  return parsedQuery
}

// Clean object for database query
export function cleanQueryObject(obj: Record<string, any>) {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => value !== undefined && value !== null)
  )
}