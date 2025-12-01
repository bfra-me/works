/**
 * API client package for synthetic monorepo.
 * Demonstrates async Result type usage and functional composition.
 */

import type {Result} from '@bfra.me/es/result'
import {err, ok} from '@bfra.me/es/result'

/** API client error */
export interface ApiClientError {
  code: 'NETWORK_ERROR' | 'TIMEOUT' | 'SERVER_ERROR' | 'PARSE_ERROR'
  message: string
  statusCode?: number
  retryable: boolean
}

/** API client configuration */
export interface ApiClientConfig {
  baseUrl: string
  timeout?: number
  retries?: number
  headers?: Record<string, string>
}

/** Request options */
export interface RequestOptions {
  headers?: Record<string, string>
  timeout?: number
}

/** Creates a configured API client */
export function createApiClient(config: ApiClientConfig) {
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...config.headers,
  }

  async function request<T>(
    method: string,
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<Result<T, ApiClientError>> {
    const url = `${config.baseUrl}${path}`
    const headers = {...defaultHeaders, ...options?.headers}

    try {
      const fetchOptions: RequestInit = {
        method,
        headers,
        signal: AbortSignal.timeout(options?.timeout ?? config.timeout ?? 30_000),
      }
      if (body !== undefined) {
        fetchOptions.body = JSON.stringify(body)
      }
      const response = await fetch(url, fetchOptions)

      if (!response.ok) {
        return err({
          code: response.status >= 500 ? 'SERVER_ERROR' : 'NETWORK_ERROR',
          message: `HTTP ${response.status}: ${response.statusText}`,
          statusCode: response.status,
          retryable: response.status >= 500,
        })
      }

      const data = (await response.json()) as T
      return ok(data)
    } catch (error) {
      if (error instanceof Error && error.name === 'TimeoutError') {
        return err({
          code: 'TIMEOUT',
          message: 'Request timed out',
          retryable: true,
        })
      }

      return err({
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        retryable: true,
      })
    }
  }

  return {
    get<T>(path: string, options?: RequestOptions) {
      return request<T>('GET', path, undefined, options)
    },

    post<T>(path: string, body: unknown, options?: RequestOptions) {
      return request<T>('POST', path, body, options)
    },

    put<T>(path: string, body: unknown, options?: RequestOptions) {
      return request<T>('PUT', path, body, options)
    },

    delete<T>(path: string, options?: RequestOptions) {
      return request<T>('DELETE', path, undefined, options)
    },
  }
}

/** Transforms API responses by applying a sequence of transforms */
export function transformResponse<T>(
  result: Result<T, ApiClientError>,
  transform: (value: T) => T,
): Result<T, ApiClientError> {
  if (!result.success) {
    return result
  }

  return ok(transform(result.data))
}
