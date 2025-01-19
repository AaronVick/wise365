// src/lib/scraping/job-manager.ts
/**
 * Job management and scheduling service
 * Handles scraping job lifecycle and coordination
 * 
 * Dependencies:
 * - prisma: Database client
 * - crawler.ts: Web crawling implementation
 * - scrape-progress.ts: WebSocket progress updates
 */

import { PrismaClient } from '@prisma/client'
import { WebCrawler } from './crawler'
import { ScrapeProgressWebSocket } from '../websocket/scrape-progress'
import { EventEmitter } from 'events'

const prisma = new PrismaClient()

interface JobOptions {
  maxConcurrent?: number
  retryAttempts?: number
  retryDelay?: number
}

class JobManager extends EventEmitter {
  private activeJobs: Map<string, WebCrawler> = new Map()
  private queue: string[] = []
  private options: JobOptions

  constructor(options: JobOptions = {}) {
    super()
    this.options = {
      maxConcurrent: options.maxConcurrent || 3,
      retryAttempts: options.retryAttempts || 3,
      retryDelay: options.retryDelay || 5000
    }
  }

  async initializeJob(jobId: string): Promise<void> {
    try {
      // Get job details
      const job = await prisma.websiteScrapeJob.findUnique({
        where: { id: jobId }
      })

      if (!job) {
        throw new Error('Job not found')
      }

      // Check active jobs limit
      if (this.activeJobs.size >= this.options.maxConcurrent!) {
        this.queue.push(jobId)
        return
      }

      // Create crawler instance
      const crawler = new WebCrawler({
        ...job.metadata?.configuration,
        onProgress: this.handleProgress.bind(this, jobId),
        onComplete: this.handleComplete.bind(this, jobId),
        onError: this.handleError.bind(this, jobId)
      })

      // Start crawling
      this.activeJobs.set(jobId, crawler)
      await crawler.start(job.websiteUrl)

      // Update job status
      await prisma.websiteScrapeJob.update({
        where: { id: jobId },
        data: { status: 'in_progress' }
      })

    } catch (error) {
      await this.handleError(jobId, error)
    }
  }

  private async handleProgress(jobId: string, progress: any): Promise<void> {
    // Create progress record in database
    await prisma.websiteScrapeProgress.create({
      data: {
        scrapeJobId: jobId,
        status: 'in_progress',
        message: 'Crawling in progress',
        details: progress
      }
    })

    // Emit progress for WebSocket
    this.emit('progress', { jobId, progress })
  }

  private async handleComplete(jobId: string, results: any): Promise<void> {
    // Update job status
    await prisma.websiteScrapeJob.update({
      where: { id: jobId },
      data: {
        status: 'completed',
        completedAt: new Date()
      }
    })

    // Clean up and process next job
    this.activeJobs.delete(jobId)
    this.processQueue()

    // Emit completion for WebSocket
    this.emit('complete', { jobId, results })
  }

  private async handleError(jobId: string, error: any): Promise<void> {
    // Update job status with error
    await prisma.websiteScrapeJob.update({
      where: { id: jobId },
      data: {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })

    // Clean up and process next job
    this.activeJobs.delete(jobId)
    this.processQueue()

    // Emit error for WebSocket
    this.emit('error', { jobId, error })
  }

  private async processQueue(): Promise<void> {
    // Check if we can process more jobs
    if (this.queue.length > 0 && this.activeJobs.size < this.options.maxConcurrent!) {
      const nextJobId = this.queue.shift()
      if (nextJobId) {
        await this.initializeJob(nextJobId)
      }
    }
  }

  // Public method to get current job status
  async getJobStatus(jobId: string): Promise<any> {
    return prisma.websiteScrapeJob.findUnique({
      where: { id: jobId },
      include: {
        progress: {
          orderBy: { timestamp: 'desc' },
          take: 1
        }
      }
    })
  }

  // Public method to cancel a job
  async cancelJob(jobId: string): Promise<void> {
    const crawler = this.activeJobs.get(jobId)
    if (crawler) {
      await crawler.stop()
      this.activeJobs.delete(jobId)
      await prisma.websiteScrapeJob.update({
        where: { id: jobId },
        data: { 
          status: 'cancelled',
          completedAt: new Date()
        }
      })
    }
    // Remove from queue if pending
    this.queue = this.queue.filter(id => id !== jobId)
  }
}

// Export singleton instance
export const jobManager = new JobManager()