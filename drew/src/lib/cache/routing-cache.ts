// src/lib/cache/routing-cache.ts
/**
 * Routing System Cache
 * 
 * Provides caching for routing configurations and capabilities.
 * Improves performance by reducing API and database calls.
 * 
 * @packageDocumentation
 */

import { Redis } from 'ioredis'
import { logger } from '../logger'
import config from '../../config/routing'

interface CacheOptions {
  ttl?: number
  namespace?: string
}

export class RoutingCache {
  private static redis: Redis
  private static readonly DEFAULT_TTL = config.cache.configTTL
  private static readonly CACHE_PREFIX = 'routing:'

  private static async getClient(): Promise<Redis> {
    if (!this.redis) {
      this.redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000)
          return delay
        }
      })

      this.redis.on('error', (error) => {
        logger.error('Redis cache error', {
          type: 'cache_error',
          error
        })
      })
    }

    return this.redis
  }

  private static formatKey(key: string, namespace?: string): string {
    const parts = [this.CACHE_PREFIX]
    if (namespace) {
      parts.push(namespace)
    }
    parts.push(key)
    return parts.join(':')
  }

  static async getConfig<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    try {
      const client = await this.getClient()
      const formattedKey = this.formatKey(key, options.namespace)
      
      const cached = await client.get(formattedKey)
      if (!cached) {
        return null
      }

      return JSON.parse(cached) as T
    } catch (error) {
      logger.error('Cache get error', {
        type: 'cache_error',
        operation: 'get',
        key,
        error
      })
      return null
    }
  }

  static async setConfig<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    try {
      const client = await this.getClient()
      const formattedKey = this.formatKey(key, options.namespace)
      const ttl = options.ttl || this.DEFAULT_TTL

      const serialized = JSON.stringify(value)
      
      if (ttl > 0) {
        await client.setex(formattedKey, ttl, serialized)
      } else {
        await client.set(formattedKey, serialized)
      }
    } catch (error) {
      logger.error('Cache set error', {
        type: 'cache_error',
        operation: 'set',
        key,
        error
      })
    }
  }

  static async invalidateConfig(key: string, options: CacheOptions = {}): Promise<void> {
    try {
      const client = await this.getClient()
      const formattedKey = this.formatKey(key, options.namespace)
      
      await client.del(formattedKey)
    } catch (error) {
      logger.error('Cache invalidate error', {
        type: 'cache_error',
        operation: 'invalidate',
        key,
        error
      })
    }
  }

  static async invalidateNamespace(namespace: string): Promise<void> {
    try {
      const client = await this.getClient()
      const pattern = this.formatKey('*', namespace)
      
      const keys = await client.keys(pattern)
      if (keys.length > 0) {
        await client.del(...keys)
      }
    } catch (error) {
      logger.error('Cache namespace invalidation error', {
        type: 'cache_error',
        operation: 'invalidate_namespace',
        namespace,
        error
      })
    }
  }

  static async getStats(): Promise<{
    size: number
    keys: string[]
    memory: number
  }> {
    try {
      const client = await this.getClient()
      const pattern = this.formatKey('*')
      
      const [keys, memory] = await Promise.all([
        client.keys(pattern),
        client.info('memory').then(info => {
          const match = info.match(/used_memory:(\d+)/)
          return match ? parseInt(match[1]) : 0
        })
      ])

      return {
        size: keys.length,
        keys,
        memory
      }
    } catch (error) {
      logger.error('Cache stats error', {
        type: 'cache_error',
        operation: 'stats',
        error
      })
      return {
        size: 0,
        keys: [],
        memory: 0
      }
    }
  }

  static async clearAll(): Promise<void> {
    try {
      const client = await this.getClient()
      const pattern = this.formatKey('*')
      
      const keys = await client.keys(pattern)
      if (keys.length > 0) {
        await client.del(...keys)
      }
    } catch (error) {
      logger.error('Cache clear error', {
        type: 'cache_error',
        operation: 'clear_all',
        error
      })
    }
  }

  static async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit()
      this.redis = null
    }
  }
}