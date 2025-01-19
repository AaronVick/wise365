// src/lib/scraping/crawler.ts
/**
 * Web crawling implementation
 * Handles the actual website crawling logic
 * 
 * Dependencies:
 * - puppeteer: For JavaScript-rendered content
 * - cheerio: For HTML parsing
 * - prisma: Database client
 */

import puppeteer from 'puppeteer'
import * as cheerio from 'cheerio'
import { URL } from 'url'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface CrawlerOptions {
  maxPages?: number
  maxDepth?: number
  excludePatterns?: string[]
  includePatterns?: string[]
  respectRobotsTxt?: boolean
  followRedirects?: boolean
  timeout?: number
  userAgent?: string
  onProgress?: (progress: any) => void
  onComplete?: (results: any) => void
  onError?: (error: any) => void
}

export class WebCrawler {
  private options: CrawlerOptions
  private visited: Set<string> = new Set()
  private queue: { url: string; depth: number }[] = []
  private browser: puppeteer.Browser | null = null
  private isStopped: boolean = false

  constructor(options: CrawlerOptions = {}) {
    this.options = {
      maxPages: options.maxPages || 1000,
      maxDepth: options.maxDepth || 3,
      excludePatterns: options.excludePatterns || [],
      includePatterns: options.includePatterns || [],
      respectRobotsTxt: options.respectRobotsTxt ?? true,
      followRedirects: options.followRedirects ?? true,
      timeout: options.timeout || 30000,
      userAgent: options.userAgent || 'WebCrawler/1.0',
      ...options
    }
  }

  async start(startUrl: string): Promise<void> {
    try {
      // Initialize browser with reasonable defaults
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu'
        ]
      })

      // Reset state
      this.visited.clear()
      this.queue = [{ url: startUrl, depth: 0 }]
      this.isStopped = false

      // Start crawling
      await this.crawl()

    } catch (error) {
      this.options.onError?.(error)
    } finally {
      await this.cleanup()
    }
  }

  async stop(): Promise<void> {
    this.isStopped = true
    await this.cleanup()
  }

  private async crawl(): Promise<void> {
    while (this.queue.length > 0 && 
           this.visited.size < this.options.maxPages! && 
           !this.isStopped) {
      const { url, depth } = this.queue.shift()!

      // Skip if already visited or max depth reached
      if (this.visited.has(url) || depth > this.options.maxDepth!) {
        continue
      }

      try {
        // Check exclude patterns
        if (this.shouldExcludeUrl(url)) {
          continue
        }

        // Process page
        const page = await this.processPage(url, depth)

        // Save to database
        await this.savePage(page)

        // Report progress
        this.options.onProgress?.({
          pagesProcessed: this.visited.size,
          queueSize: this.queue.length,
          currentUrl: url,
          currentDepth: depth
        })

      } catch (error) {
        console.error(`Error crawling ${url}:`, error)
        await this.saveError(url, error)
      }
    }

    // Crawling complete
    if (!this.isStopped) {
      this.options.onComplete?.({
        totalPages: this.visited.size,
        successful: this.visited.size,
        failed: this.queue.length
      })
    }
  }

  private async processPage(url: string, depth: number): Promise<any> {
    const page = await this.browser!.newPage()
    
    try {
      // Configure page
      await page.setUserAgent(this.options.userAgent!)
      await page.setDefaultNavigationTimeout(this.options.timeout)

      // Handle JavaScript dialogs automatically
      page.on('dialog', async dialog => {
        await dialog.dismiss()
      })

      // Navigate to page
      await page.goto(url, {
        waitUntil: 'networkidle0',
        timeout: this.options.timeout
      })

      // Get page content and metadata
      const content = await page.content()
      const title = await page.title()
      const $ = cheerio.load(content)

      // Extract metadata
      const metadata = await this.extractMetadata(page)

      // Extract links
      const links = this.extractLinks($, url)
      
      // Add valid links to queue
      for (const link of links) {
        if (this.isValidUrl(link) && !this.shouldExcludeUrl(link)) {
          this.queue.push({ url: link, depth: depth + 1 })
        }
      }

      // Mark as visited
      this.visited.add(url)

      return {
        url,
        title,
        content,
        links,
        metadata
      }

    } finally {
      await page.close()
    }
  }

  private async extractMetadata(page: puppeteer.Page): Promise<any> {
    return page.evaluate(() => ({
      description: document.querySelector('meta[name="description"]')?.getAttribute('content'),
      keywords: document.querySelector('meta[name="keywords"]')?.getAttribute('content'),
      ogTitle: document.querySelector('meta[property="og:title"]')?.getAttribute('content'),
      ogDescription: document.querySelector('meta[property="og:description"]')?.getAttribute('content'),
      ogImage: document.querySelector('meta[property="og:image"]')?.getAttribute('content')
    }))
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  private shouldExcludeUrl(url: string): boolean {
    // Check exclude patterns
    if (this.options.excludePatterns?.some(pattern => url.includes(pattern))) {
      return true
    }

    // Check include patterns
    if (this.options.includePatterns?.length &&
        !this.options.includePatterns.some(pattern => url.includes(pattern))) {
      return true
    }

    return false
  }

  private extractLinks($: cheerio.CheerioAPI, baseUrl: string): string[] {
    const links: string[] = []
    $('a[href]').each((_, element) => {
      const href = $(element).attr('href')
      if (href) {
        try {
          const absoluteUrl = new URL(href, baseUrl).toString()
          links.push(absoluteUrl)
        } catch {
          // Invalid URL, skip
        }
      }
    })
    return links
  }

  private async savePage(page: any): Promise<void> {
    await prisma.websitePage.create({
      data: {
        url: page.url,
        title: page.title,
        content: page.content,
        status: 'success',
        metadata: {
          links: page.links,
          ...page.metadata
        }
      }
    })
  }

  private async saveError(url: string, error: any): Promise<void> {
    await prisma.websitePage.create({
      data: {
        url,
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      }
    })
  }

  private async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }
}