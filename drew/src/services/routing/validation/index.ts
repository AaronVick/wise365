// src/services/routing/index.ts
/**
 * Routing Service Factory
 * 
 * Centralizes service initialization and dependency injection for the routing system.
 * Ensures singleton instances and proper configuration of all routing services.
 * 
 * @packageDocumentation
 */

import { PrismaClient } from '@prisma/client'
import config from '../../config/routing'
import { RouterConfigService } from './implementations/router-config.service'
import { NotDiamondService } from './implementations/not-diamond.service'
import { RoutingAnalyzerService } from './implementations/routing-analyzer.service'
import { RoutingHistoryService } from './implementations/routing-history.service'

// Initialize Prisma client
const prisma = new PrismaClient()

// Initialize services
export const routerConfigService = new RouterConfigService(prisma)
export const notDiamondService = new NotDiamondService(
  config.notDiamond.apiKey,
  config.notDiamond.apiEndpoint
)
export const routingAnalyzerService = new RoutingAnalyzerService(
  notDiamondService,
  routerConfigService
)
export const routingHistoryService = new RoutingHistoryService(prisma)
