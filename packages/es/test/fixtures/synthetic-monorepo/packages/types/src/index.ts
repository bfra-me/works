/**
 * Shared types package for synthetic monorepo.
 * Contains type definitions used across multiple packages.
 */

export type {ApiRequest, ApiResponse, HttpMethod, PaginatedResponse} from './api'
export type {
  AsyncResult,
  DeepPartial,
  DeepReadonly,
  MaybePromise,
  Nullable,
  Optional,
} from './common'
