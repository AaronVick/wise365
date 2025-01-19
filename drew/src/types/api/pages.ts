// src/pages/api/website-scrape/pages.ts
/**
 * API endpoint for retrieving scraped pages with pagination
 * 
 * Dependencies:
 * - src/lib/prisma.ts: Database client
 * - src/lib/api-utils.ts: Pagination utilities
 * 
 * Provides paginated access to the pages scraped for a specific job.
 * Supports:
 * - Pagination
 * - Status filtering
 * - Sort ordering
 * - Basic search
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { getPaginationParams } from '@/lib/api-utils'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { jobId } = req.query
    if (!jobId || typeof jobId !== 'string') {
      return res.status(400).json({ error: 'Invalid job ID' })
    }

    // Get pagination parameters
    const { page, pageSize } = getPaginationParams(req)

    // Get optional filters from query parameters
    const status = req.query.status as string | undefined
    const search = req.query.search as string | undefined
    const sortBy = req.query.sortBy as string || 'scrapedAt'
    const sortOrder = req.query.sortOrder as 'asc' | 'desc' || 'desc'

    // Build where clause for filtering
    const whereClause: any = {
      scrapeJobId: jobId
    }

    if (status) {
      whereClause.status = status
    }

    if (search) {
      whereClause.OR = [
        { url: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Verify the job exists and user has access
    const job = await prisma.websiteScrapeJob.findUnique({
      where: { id: jobId },
      select: { id: true }
    })

    if (!job) {
      return res.status(404).json({ error: 'Scraping job not found' })
    }

    // Get total count for pagination
    const total = await prisma.websitePage.count({
      where: whereClause
    })

    // Get paginated results
    const pages = await prisma.websitePage.findMany({
      where: whereClause,
      select: {
        url: true,
        title: true,
        status: true,
        scrapedAt: true,
        errorMessage: true,
        metadata: true,
        // Exclude large content field for performance
        content: false
      },
      orderBy: {
        [sortBy]: sortOrder
      },
      skip: (page - 1) * pageSize,
      take: pageSize
    })

    // Format the response
    const response = {
      jobId,
      pages: pages.map(page => ({
        url: page.url,
        title: page.title,
        status: page.status,
        scrapedAt: page.scrapedAt,
        errorMessage: page.errorMessage,
        metadata: page.metadata
      })),
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        hasMore: total > page * pageSize
      }
    }

    // Return success response
    return res.status(200).json(response)

  } catch (error) {
    // Log the error for debugging
    console.error('Error fetching scraped pages:', error)

    // Return appropriate error response
    if (error instanceof Error) {
      return res.status(500).json({ 
        error: 'Failed to fetch scraped pages',
        message: error.message
      })
    }

    return res.status(500).json({ 
      error: 'Failed to fetch scraped pages',
      message: 'An unknown error occurred'
    })
  }
}