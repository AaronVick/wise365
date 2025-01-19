// lib/prisma.ts
/**
 * Global Prisma client instance
 * 
 * This file provides a singleton instance of PrismaClient to be used across the application.
 * Prevents multiple instances of PrismaClient in development.
 */

import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

export const prisma = global.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') global.prisma = prisma

