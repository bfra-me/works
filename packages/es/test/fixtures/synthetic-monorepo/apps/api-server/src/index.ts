/**
 * API server entry point.
 * Demonstrates Node.js server patterns with Result-based error handling.
 */

import type {Result} from '@bfra.me/es/result'
import {err, ok} from '@bfra.me/es/result'

/** Server error */
export interface ServerError {
  code: 'STARTUP_ERROR' | 'HANDLER_ERROR' | 'SHUTDOWN_ERROR'
  message: string
  statusCode: number
}

/** Request handler type */
export type RequestHandler = (
  req: ServerRequest,
  res: ServerResponse,
) => Promise<Result<void, ServerError>>

/** Server request */
export interface ServerRequest {
  method: string
  path: string
  headers: Record<string, string>
  body?: unknown
}

/** Server response */
export interface ServerResponse {
  status: (code: number) => ServerResponse
  json: (data: unknown) => void
  send: (data: string) => void
}

/** Route definition */
export interface Route {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  handler: RequestHandler
}

/** Creates a simple server */
export function createServer(port: number) {
  const routes: Route[] = []

  return {
    route(method: Route['method'], path: string, handler: RequestHandler): void {
      routes.push({method, path, handler})
    },

    findRoute(method: string, path: string): Route | undefined {
      return routes.find(r => r.method === method && r.path === path)
    },

    async handleRequest(
      req: ServerRequest,
      res: ServerResponse,
    ): Promise<Result<void, ServerError>> {
      const route = this.findRoute(req.method, req.path)

      if (!route) {
        res.status(404).json({error: 'Not found'})
        return err({
          code: 'HANDLER_ERROR',
          message: `No route found for ${req.method} ${req.path}`,
          statusCode: 404,
        })
      }

      try {
        return await route.handler(req, res)
      } catch (error) {
        res.status(500).json({error: 'Internal server error'})
        return err({
          code: 'HANDLER_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          statusCode: 500,
        })
      }
    },

    async start(): Promise<Result<void, ServerError>> {
      console.log(`Server starting on port ${port}`)
      return ok(undefined)
    },

    async stop(): Promise<Result<void, ServerError>> {
      console.log('Server stopping')
      return ok(undefined)
    },
  }
}

/** Creates a health check handler */
export function createHealthHandler(): RequestHandler {
  return async (_req, res) => {
    res.status(200).json({status: 'ok', timestamp: new Date().toISOString()})
    return ok(undefined)
  }
}
