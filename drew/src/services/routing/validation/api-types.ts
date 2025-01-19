// src/services/routing/validation/api-types.ts
/**
 * API Validation Schemas
 * 
 * Zod schemas for validating API requests and responses in the routing system.
 * Provides type safety and validation for all routing-related operations.
 * 
 * @packageDocumentation
 */

import { z } from 'zod'

export const RouterConfigSchema = z.object({
  taskType: z.string().min(1),
  priority: z.number().int().min(0),
  provider: z.string().min(1),
  model: z.string().min(1),
  isDefault: z.boolean(),
  cost: z.number().min(0),
  capabilities: z.object({
    supportedTasks: z.array(z.string()),
    maxTokens: z.number().optional(),
    contextWindow: z.number().optional(),
    specialFeatures: z.array(z.string()).optional()
  }).and(z.record(z.any())),
  metadata: z.object({
    apiEndpoint: z.string().url().optional(),
    rateLimit: z.number().min(0).optional(),
    timeout: z.number().min(0).optional()
  }).and(z.record(z.any())).optional()
})

export const AnalyzeContentSchema = z.object({
  content: z.string().min(1),
  taskType: z.string().optional(),
  tenantId: z.string().min(1),
  conversationId: z.string().optional(),
  messageId: z.string().optional()
}).refine(
  data => !(data.conversationId && !data.messageId) && !(!data.conversationId && data.messageId),
  {
    message: "Both conversationId and messageId must be provided if either is present"
  }
)

export const ReportOutcomeSchema = z.object({
  routingId: z.string().min(1),
  performance: z.object({
    latency: z.number().min(0),
    tokenCount: z.number().min(0).optional(),
    cost: z.number().min(0).optional(),
    success: z.boolean(),
    errorType: z.string().optional()
  }).and(z.record(z.any()))
})

export const AnalyticsQuerySchema = z.object({
  startDate: z.string().transform(str => new Date(str)).refine(
    date => !isNaN(date.getTime()),
    { message: "Invalid start date" }
  ),
  endDate: z.string().transform(str => new Date(str)).refine(
    date => !isNaN(date.getTime()),
    { message: "Invalid end date" }
  ),
  tenantId: z.string().optional(),
  taskTypes: z.array(z.string()).optional(),
  providers: z.array(z.string()).optional()
}).refine(
  data => data.startDate <= data.endDate,
  {
    message: "Start date must be before or equal to end date",
    path: ["startDate"]
  }
)