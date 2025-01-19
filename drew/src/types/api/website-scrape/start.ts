// src/types/api/website-scrape/start.ts
/**
 * API endpoint for initiating website scraping jobs
 * 
 * Dependencies:
 * - src/lib/website-validator.ts
 * - src/lib/scraping/job-manager.ts
 * - src/lib/websocket/scrape-progress.ts
 * 
 * This endpoint validates the input, creates a new scraping job,
 * and initializes the scraping process.
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { validateWebsite } from '@/lib/website-validator'
import { initializeScrapeJob } from '@/lib/scraping/job-manager'
import { prisma } from '@/lib/prisma'
import { StartScrapeRequestSchema } from '@/types/api/website-scraper.types'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const data = StartScrapeRequestSchema.parse(req.body)
    
    // Validate website URL and accessibility
    const validationResult = await validateWebsite(data.websiteUrl)
    if (!validationResult.isValid) {
      return res.status(400).json({ 
        error: 'Invalid website',
        details: validationResult.errors 
      })
    }

    // Create scraping job
    const job = await prisma.websiteScrapeJob.create({
      data: {
        tenantId: data.tenantId,
        teamId: data.teamId,
        userId: data.userId,
        websiteUrl: data.websiteUrl,
        status: 'queued',
        metadata: { configuration: data.configuration },
      }
    })

    // Initialize scraping process
    await initializeScrapeJob(job.id)

    return res.status(200).json({
      jobId: job.id,
      status: job.status,
      websiteUrl: job.websiteUrl,
      startedAt: job.startedAt,
      configuration: data.configuration
    })
  } catch (error) {
    console.error('Error starting scrape job:', error)
    return res.status(500).json({ error: 'Failed to start scraping job' })
  }
}