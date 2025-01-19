// src/types/api/website-scraper.types.ts
/**
 * Type definitions for the website scraping system
 * 
 * Related files:
 * - src/pages/api/website-scrape/start.ts
 * - src/pages/api/website-scrape/status.ts
 * - src/pages/api/website-scrape/pages.ts
 * - src/lib/websocket/scrape-progress.ts
 * 
 * These types are used throughout the scraping system to ensure
 * type safety and consistent data structures.
 */

import { z } from 'zod'

// Validation schema for incoming scrape requests
export const StartScrapeRequestSchema = z.object({
  tenantId: z.string(),
  teamId: z.string().optional(),
  userId: z.string(),
  websiteUrl: z.string().url(),
  configuration: z.object({
    maxPages: z.number().optional(),
    maxDepth: z.number().optional(),
    excludePatterns: z.array(z.string()).optional(),
    includePatterns: z.array(z.string()).optional(),
    respectRobotsTxt: z.boolean().optional().default(true),
    followRedirects: z.boolean().optional().default(true),
    timeout: z.number().optional().default(30000),
    userAgent: z.string().optional(),
    ignoreQuery: z.boolean().optional().default(false),
  }).optional()
})

export type StartScrapeRequest = z.infer<typeof StartScrapeRequestSchema>

// Response types for different API endpoints
export interface StartScrapeResponse {
  jobId: string
  status: WebsiteScraping.ScrapeJob['status']
  websiteUrl: string
  startedAt: Date
  configuration: Record<string, any>
}

export interface GetJobStatusResponse {
  jobId: string
  status: WebsiteScraping.ScrapeJob['status']
  progress: {
    pagesProcessed: number
    totalPages: number | null
    currentDepth: number
    lastUpdate: Date
    recentErrors?: Array<{
      url: string
      error: string
      timestamp: Date
    }>
  }
  completedAt?: Date
  error?: string
}

export interface GetJobPagesResponse {
  jobId: string
  pages: Array<{
    url: string
    title?: string
    status: 'success' | 'failed'
    scrapedAt: Date
    errorMessage?: string
  }>
  pagination: {
    total: number
    page: number
    pageSize: number
    hasMore: boolean
  }
}

// WebSocket message types
export interface WebSocketMessage {
  type: 'progress' | 'completion' | 'error'
  jobId: string
  data: ProgressUpdate | CompletionUpdate | ErrorUpdate
}

export interface ProgressUpdate {
  pagesProcessed: number
  totalPages: number | null
  currentUrl?: string
  currentDepth: number
  timestamp: Date
}

export interface CompletionUpdate {
  totalPages: number
  successCount: number
  failureCount: number
  completedAt: Date
}

export interface ErrorUpdate {
  error: string
  url?: string
  timestamp: Date
}