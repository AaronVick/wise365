// src/types/api/website-scrape/progress.ts
/**
 * WebSocket handler for real-time scraping progress updates
 * 
 * Dependencies:
 * - src/types/api/website-scraper.types.ts
 * 
 * Manages WebSocket connections and broadcasts progress updates
 * to connected clients.
 */

import { Server as WebSocketServer } from 'ws'
import { Server as HTTPServer } from 'http'
import { 
  WebSocketMessage, 
  ProgressUpdate, 
  CompletionUpdate, 
  ErrorUpdate 
} from '@/types/api/website-scraper.types'

export class ScrapeProgressWebSocket {
  private wss: WebSocketServer
  private connections: Map<string, Set<WebSocket>> = new Map()

  constructor(server: HTTPServer) {
    this.wss = new WebSocketServer({ server })
    this.initialize()
  }

  private initialize() {
    this.wss.on('connection', (ws: WebSocket) => {
      ws.on('message', (message: string) => {
        try {
          const { jobId } = JSON.parse(message)
          this.addConnection(jobId, ws)
        } catch (error) {
          console.error('WebSocket message error:', error)
        }
      })

      ws.on('close', () => {
        this.removeConnection(ws)
      })
    })
  }

  // Methods for managing connections and broadcasting updates...
  // [Rest of the WebSocket implementation]
}