// src/services/website-analysis.service.ts
/**
 * Website Analysis Service
 * 
 * This service handles the LLM-based analysis of scraped website content.
 * It processes website data and generates structured analysis using specified LLM models.
 * 
 * Dependencies:
 * - src/lib/llm/llm-client.ts - LLM API client wrapper
 * - src/lib/prisma.ts - Database client
 * - src/utils/logger.ts - Logging utility
 * - src/types/global.d.ts - Type definitions
 */

import { PrismaClient } from '@prisma/client'
import { LLMClient } from '../lib/llm/llm-client'
import { logger } from '../utils/logger'
import { chunk } from 'lodash'

const prisma = new PrismaClient()

interface AnalysisOptions {
  batchSize?: number
  maxRetries?: number
  retryDelay?: number
  includeContent?: boolean
}

interface AnalysisRequest {
  tenantId: string
  teamId?: string
  userId: string
  modelId: string
  scrapeJobId: string
}

export class WebsiteAnalysisService {
  private llmClient: LLMClient

  constructor() {
    this.llmClient = new LLMClient()
  }

  async analyzeWebsite(request: AnalysisRequest, options: AnalysisOptions = {}) {
    const {
      batchSize = 10,
      maxRetries = 3,
      retryDelay = 1000,
      includeContent = true
    } = options

    try {
      // Validate the model exists and is active
      const model = await prisma.lLMModel.findFirst({
        where: {
          id: request.modelId,
          isActive: true,
          provider: {
            isActive: true
          }
        },
        include: {
          provider: true
        }
      })

      if (!model) {
        throw new Error('Invalid or inactive LLM model specified')
      }

      // Get pages to analyze
      const pages = await prisma.websitePage.findMany({
        where: {
          scrapeJobId: request.scrapeJobId,
          status: 'success'
        },
        select: {
          id: true,
          url: true,
          title: true,
          content: includeContent,
          metadata: true
        }
      })

      // Process pages in batches
      const batches = chunk(pages, batchSize)
      let processedCount = 0

      for (const batch of batches) {
        await Promise.all(batch.map(async page => {
          let retries = 0
          let success = false

          while (!success && retries < maxRetries) {
            try {
              const analysis = await this.analyzePage(page, model)
              await this.saveAnalysis({
                scrapeJobId: request.scrapeJobId,
                pageId: page.id,
                modelId: model.id,
                analysis
              })
              success = true
              processedCount++

              // Update progress
              await this.updateProgress(request.scrapeJobId, {
                pagesProcessed: processedCount,
                totalPages: pages.length
              })

            } catch (error) {
              retries++
              if (retries === maxRetries) {
                await this.saveAnalysisError(request.scrapeJobId, page.id, model.id, error)
              } else {
                await new Promise(resolve => setTimeout(resolve, retryDelay))
              }
            }
          }
        }))
      }

      return {
        totalPages: pages.length,
        processedPages: processedCount,
        status: 'completed'
      }

    } catch (error) {
      logger.error('Website analysis failed:', error)
      throw error
    }
  }

  private async analyzePage(page: any, model: any) {
    const prompt = this.buildAnalysisPrompt(page)
    const response = await this.llmClient.analyze(model.provider.name, model.name, prompt)
    return this.structureAnalysis(response)
  }

  private buildAnalysisPrompt(page: any): string {
    return `
      Analyze the following webpage and provide a structured analysis:
      URL: ${page.url}
      Title: ${page.title}
      
      Please analyze the following aspects:
      1. Primary purpose of the page
      2. Key business information
      3. Main topics/themes
      4. Content quality and relevance
      5. Technical aspects
      6. SEO elements
      7. Business value proposition
      8. Target audience indicators
      
      Content to analyze:
      ${page.content || 'No content available'}
      
      Metadata:
      ${JSON.stringify(page.metadata, null, 2)}
    `
  }

  private structureAnalysis(response: any) {
    // Convert LLM response to structured format
    return {
      timestamp: new Date(),
      aspects: {
        purpose: response.purpose,
        businessInfo: response.businessInfo,
        topics: response.topics,
        contentQuality: response.contentQuality,
        technical: response.technical,
        seo: response.seo,
        valueProposition: response.valueProposition,
        targetAudience: response.targetAudience
      },
      summary: response.summary,
      recommendations: response.recommendations
    }
  }

  private async saveAnalysis(data: any) {
    return prisma.websiteAnalysis.create({
      data: {
        scrapeJobId: data.scrapeJobId,
        pageId: data.pageId,
        modelId: data.modelId,
        status: 'completed',
        analysis: data.analysis
      }
    })
  }

  private async saveAnalysisError(scrapeJobId: string, pageId: string, modelId: string, error: any) {
    return prisma.websiteAnalysis.create({
      data: {
        scrapeJobId,
        pageId,
        modelId,
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        analysis: {}
      }
    })
  }

  private async updateProgress(scrapeJobId: string, progress: any) {
    return prisma.websiteScrapeProgress.create({
      data: {
        scrapeJobId,
        status: 'analyzing',
        message: 'Processing website analysis',
        details: progress
      }
    })
  }
}