// src/pages/api/website-scrape/status.ts
/**
 * API endpoint for retrieving scraping job status
 * 
 * Dependencies:
 * - src/lib/prisma.ts
 * 
 * Provides current status and progress information for a specific scraping job.
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { jobId } = req.query
  if (!jobId || typeof jobId !== 'string') {
    return res.status(400).json({ error: 'Invalid job ID' })
  }

  try {
    const job = await prisma.websiteScrapeJob.findUnique({
      where: { id: jobId },
      include: {
        progress: {
          orderBy: { timestamp: 'desc' },
          take: 1
        }
      }
    })

    if (!job) {
      return res.status(404).json({ error: 'Scraping job not found' })
    }

    // Get progress details...
    // [Rest of the status endpoint implementation]
  } catch (error) {
    console.error('Error fetching job status:', error)
    return res.status(500).json({ error: 'Failed to fetch job status' })
  }
}