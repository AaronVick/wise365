

// src/config/routing.ts
/**
 * Routing System Configuration
 * 
 * Central configuration for the Not Diamond routing system including
 * defaults, constants, and environment-specific settings.
 * 
 * @packageDocumentation
 */

interface RoutingConfig {
  notDiamond: {
    apiEndpoint: string
    apiKey: string
    timeout: number
    retryAttempts: number
    retryDelay: number
  }
  rateLimit: {
    analysisRequests: {
      limit: number
      windowMs: number
    }
    configurationRequests: {
      limit: number
      windowMs: number
    }
  }
  defaults: {
    taskTypes: string[]
    providers: {
      [key: string]: {
        models: string[]
        capabilities: string[]
      }
    }
    fallbackProvider: string
    fallbackModel: string
  }
  analytics: {
    retentionDays: number
    aggregationIntervals: {
      short: number  // in minutes
      medium: number // in hours
      long: number   // in days
    }
  }
  cache: {
    configTTL: number      // in seconds
    analyticsTTL: number   // in seconds
    capabilitiesTTL: number // in seconds
  }
}

const config: RoutingConfig = {
  notDiamond: {
    apiEndpoint: process.env.NOT_DIAMOND_API_ENDPOINT || 'https://api.notdiamond.com/v1',
    apiKey: process.env.NOT_DIAMOND_API_KEY || '',
    timeout: parseInt(process.env.NOT_DIAMOND_TIMEOUT || '30000'), // 30 seconds
    retryAttempts: parseInt(process.env.NOT_DIAMOND_RETRY_ATTEMPTS || '3'),
    retryDelay: parseInt(process.env.NOT_DIAMOND_RETRY_DELAY || '1000') // 1 second
  },
  rateLimit: {
    analysisRequests: {
      limit: parseInt(process.env.ANALYSIS_RATE_LIMIT || '100'),
      windowMs: parseInt(process.env.ANALYSIS_RATE_WINDOW || '60000') // 1 minute
    },
    configurationRequests: {
      limit: parseInt(process.env.CONFIG_RATE_LIMIT || '50'),
      windowMs: parseInt(process.env.CONFIG_RATE_WINDOW || '60000') // 1 minute
    }
  },
  defaults: {
    taskTypes: [
      'blog',
      'image',
      'code',
      'summarization',
      'analysis',
      'conversation',
      'document'
    ],
    providers: {
      openai: {
        models: ['gpt-4', 'gpt-3.5-turbo'],
        capabilities: ['text', 'code', 'analysis']
      },
      anthropic: {
        models: ['claude-3', 'claude-instant'],
        capabilities: ['text', 'analysis', 'conversation']
      },
      flux: {
        models: ['flux-v1'],
        capabilities: ['image']
      }
    },
    fallbackProvider: 'anthropic',
    fallbackModel: 'claude-instant'
  },
  analytics: {
    retentionDays: parseInt(process.env.ANALYTICS_RETENTION_DAYS || '90'),
    aggregationIntervals: {
      short: 5,    // 5 minutes
      medium: 1,   // 1 hour
      long: 1      // 1 day
    }
  },
  cache: {
    configTTL: 300,      // 5 minutes
    analyticsTTL: 600,   // 10 minutes
    capabilitiesTTL: 3600 // 1 hour
  }
}

// Export the configuration
export default config

// Export helper functions
export function isValidTaskType(taskType: string): boolean {
  return config.defaults.taskTypes.includes(taskType)
}

export function isValidProvider(provider: string): boolean {
  return provider in config.defaults.providers
}

export function isValidModel(provider: string, model: string): boolean {
  return (
    isValidProvider(provider) &&
    config.defaults.providers[provider].models.includes(model)
  )
}

export function getProviderCapabilities(provider: string): string[] {
  if (!isValidProvider(provider)) {
    return []
  }
  return config.defaults.providers[provider].capabilities
}

export function getFallbackRoute() {
  return {
    provider: config.defaults.fallbackProvider,
    model: config.defaults.fallbackModel
  }
}

export function getRetryConfig() {
  return {
    attempts: config.notDiamond.retryAttempts,
    delay: config.notDiamond.retryDelay
  }
}

// Environment-specific validation
function validateConfig() {
  if (!config.notDiamond.apiKey) {
    throw new Error('NOT_DIAMOND_API_KEY is required')
  }

  if (!config.notDiamond.apiEndpoint) {
    throw new Error('NOT_DIAMOND_API_ENDPOINT is required')
  }

  // Timeout and Retry Configuration
  if (config.notDiamond.timeout < 1000) {
    throw new Error('NOT_DIAMOND_TIMEOUT must be at least 1000ms')
  }

  if (config.notDiamond.retryAttempts < 0) {
    throw new Error('NOT_DIAMOND_RETRY_ATTEMPTS must be non-negative')
  }

  if (config.notDiamond.retryDelay < 100) {
    throw new Error('NOT_DIAMOND_RETRY_DELAY must be at least 100ms')
  }

  // Rate Limit Configuration
  if (config.rateLimit.analysisRequests.limit < 1) {
    throw new Error('ANALYSIS_RATE_LIMIT must be at least 1')
  }

  if (config.rateLimit.analysisRequests.windowMs < 1000) {
    throw new Error('ANALYSIS_RATE_WINDOW must be at least 1000ms')
  }

  if (config.rateLimit.configurationRequests.limit < 1) {
    throw new Error('CONFIG_RATE_LIMIT must be at least 1')
  }

  if (config.rateLimit.configurationRequests.windowMs < 1000) {
    throw new Error('CONFIG_RATE_WINDOW must be at least 1000ms')
  }

  // Provider Configuration
  if (!config.defaults.taskTypes.length) {
    throw new Error('At least one task type must be defined')
  }

  if (!config.defaults.fallbackProvider || !config.defaults.fallbackModel) {
    throw new Error('Fallback provider and model must be defined')
  }

  // Validate fallback provider exists in providers
  if (!config.defaults.providers[config.defaults.fallbackProvider]) {
    throw new Error('Fallback provider must be a valid provider')
  }

  // Validate fallback model exists in fallback provider's models
  if (!config.defaults.providers[config.defaults.fallbackProvider].models
        .includes(config.defaults.fallbackModel)) {
    throw new Error('Fallback model must be a valid model for the fallback provider')
  }

  // Provider Model Validation
  Object.entries(config.defaults.providers).forEach(([provider, config]) => {
    if (!config.models || config.models.length === 0) {
      throw new Error(`Provider ${provider} must have at least one model defined`)
    }
    if (!config.capabilities || config.capabilities.length === 0) {
      throw new Error(`Provider ${provider} must have at least one capability defined`)
    }
  })

  // Analytics Configuration
  if (config.analytics.retentionDays < 1) {
    throw new Error('ANALYTICS_RETENTION_DAYS must be at least 1')
  }

  if (config.analytics.aggregationIntervals.short < 1) {
    throw new Error('Short aggregation interval must be at least 1 minute')
  }

  if (config.analytics.aggregationIntervals.medium < 1) {
    throw new Error('Medium aggregation interval must be at least 1 hour')
  }

  if (config.analytics.aggregationIntervals.long < 1) {
    throw new Error('Long aggregation interval must be at least 1 day')
  }

  // Cache Configuration
  if (config.cache.configTTL < 0) {
    throw new Error('Config cache TTL must be non-negative')
  }

  if (config.cache.analyticsTTL < 0) {
    throw new Error('Analytics cache TTL must be non-negative')
  }

  if (config.cache.capabilitiesTTL < 0) {
    throw new Error('Capabilities cache TTL must be non-negative')
  }
}


// Run validation in non-production environments
if (process.env.NODE_ENV !== 'production') {
  validateConfig()
}