// src/utils/logger.ts
/**
 * Logging Utility
 * 
 * Provides structured logging capabilities throughout the application.
 * Supports different log levels and formats based on environment.
 * 
 * Dependencies:
 * - winston: Logging framework
 * - winston-daily-rotate-file: Log rotation (optional for production)
 * 
 * Environment Variables:
 * - LOG_LEVEL: Minimum log level (default: 'info')
 * - NODE_ENV: Environment name (development/production)
 */

import winston from 'winston'
import 'winston-daily-rotate-file'

// Define log levels and colors
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
}

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
}

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}${
      info.metadata ? '\n' + JSON.stringify(info.metadata, null, 2) : ''
    }`
  )
)

// Create transports based on environment
const transports = [
  // Always write to console
  new winston.transports.Console(),
]

// Add file transport in production
if (process.env.NODE_ENV === 'production') {
  transports.push(
    new winston.transports.DailyRotateFile({
      filename: 'logs/app-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: winston.format.combine(
        winston.format.uncolorize(),
        format
      )
    })
  )
}

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format,
  transports
})

// Add custom methods for structured logging
export interface LogMetadata {
  [key: string]: any
}

class Logger {
  error(message: string, metadata?: LogMetadata) {
    logger.error(message, { metadata })
  }

  warn(message: string, metadata?: LogMetadata) {
    logger.warn(message, { metadata })
  }

  info(message: string, metadata?: LogMetadata) {
    logger.info(message, { metadata })
  }

  http(message: string, metadata?: LogMetadata) {
    logger.http(message, { metadata })
  }

  debug(message: string, metadata?: LogMetadata) {
    logger.debug(message, { metadata })
  }

  // Specialized logging methods for specific use cases
  apiRequest(method: string, url: string, metadata?: LogMetadata) {
    this.http(`API Request: ${method} ${url}`, metadata)
  }

  apiResponse(method: string, url: string, status: number, metadata?: LogMetadata) {
    this.http(`API Response: ${method} ${url} - Status: ${status}`, metadata)
  }

  jobStart(jobType: string, jobId: string, metadata?: LogMetadata) {
    this.info(`Starting job: ${jobType} (${jobId})`, metadata)
  }

  jobComplete(jobType: string, jobId: string, metadata?: LogMetadata) {
    this.info(`Completed job: ${jobType} (${jobId})`, metadata)
  }

  jobError(jobType: string, jobId: string, error: Error, metadata?: LogMetadata) {
    this.error(`Job error: ${jobType} (${jobId}) - ${error.message}`, {
      ...metadata,
      error: {
        message: error.message,
        stack: error.stack,
      }
    })
  }
}

// Export singleton instance
export const logger = new Logger()

// Configure winston to use colors
winston.addColors(colors)