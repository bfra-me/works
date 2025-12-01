/**
 * API-related type definitions.
 */

import type {Result} from '@bfra.me/es/result'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface ApiRequest<TBody = unknown> {
  method: HttpMethod
  path: string
  headers?: Record<string, string>
  body?: TBody
  timeout?: number
}

export interface ApiResponse<TData = unknown> {
  status: number
  headers: Record<string, string>
  data: TData
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown>
}

export type ApiResult<T> = Result<ApiResponse<T>, ApiError>
