// src/lib/website-validator.ts

/**
 * Website validation service
 * Validates website accessibility and structure
 * 
 * Dependencies:
 * - node-fetch: For making HTTP requests
 * - robots-parser: For parsing robots.txt
 */

import fetch from 'node-fetch'
import * as robotsParser from 'robots-parser'
import { URL } from 'url'

interface ValidationResult {
  isValid: boolean
  errors: string[]
  metadata?: {
    title?: string
    robotsTxt?: string
    statusCode?: number
    contentType?: string
    redirectChain?: string[]
  }
}

interface ValidatorOptions {
  timeout?: number
  followRedirects?: boolean
  validateRobotsTxt?: boolean
  userAgent?: string
}

export async function validateWebsite(
  url: string, 
  options: ValidatorOptions = {}
): Promise<ValidationResult> {
  const errors: string[] = []
  const metadata: ValidationResult['metadata'] = {}

  try {
    // Parse and validate URL structure
    const parsedUrl = new URL(url)
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      errors.push('Invalid protocol. Only HTTP/HTTPS supported')
      return { isValid: false, errors }
    }

    // Attempt to fetch the website
    const response = await fetch(url, {
      method: 'GET',
      redirect: options.followRedirects ? 'follow' : 'manual',
      timeout: options.timeout || 30000,
      headers: {
        'User-Agent': options.userAgent || 'WebsiteValidator/1.0'
      }
    })

    metadata.statusCode = response.status
    metadata.contentType = response.headers.get('content-type') || undefined

    // Check status code
    if (response.status >= 400) {
      errors.push(`Website returned error status: ${response.status}`)
      return { isValid: false, errors, metadata }
    }

    // Get page title
    if (response.headers.get('content-type')?.includes('text/html')) {
      const text = await response.text()
      const titleMatch = text.match(/<title>(.*?)<\/title>/i)
      metadata.title = titleMatch ? titleMatch[1] : undefined
    }

    // Check robots.txt if enabled
    if (options.validateRobotsTxt) {
      const robotsUrl = new URL('/robots.txt', parsedUrl.origin)
      const robotsResponse = await fetch(robotsUrl.toString())
      if (robotsResponse.ok) {
        metadata.robotsTxt = await robotsResponse.text()
        const robots = robotsParser(robotsUrl.toString(), metadata.robotsTxt)
        if (!robots.isAllowed(url, options.userAgent || 'WebsiteValidator/1.0')) {
          errors.push('URL is blocked by robots.txt')
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      metadata
    }

  } catch (error) {
    if (error instanceof Error) {
      errors.push(`Validation failed: ${error.message}`)
    } else {
      errors.push('Validation failed with unknown error')
    }
    return { isValid: false, errors }
  }
}