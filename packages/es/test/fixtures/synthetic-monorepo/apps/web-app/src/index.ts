/**
 * Web application entry point.
 * Demonstrates consuming multiple packages with cross-package Result handling.
 */

import type {Result} from '@bfra.me/es/result'
import {isOk} from '@bfra.me/es/result'

/** Application error */
export interface AppError {
  code: string
  message: string
  source: string
}

/** Converts any error to AppError */
export function toAppError(error: {code: string; message: string}, source: string): AppError {
  return {
    code: error.code,
    message: error.message,
    source,
  }
}

/** Handles a Result and logs appropriately */
export function handleResult<T>(result: Result<T, AppError>, onSuccess: (data: T) => void): void {
  if (isOk(result)) {
    onSuccess(result.data)
  } else {
    console.error(`[${result.error.source}] ${result.error.code}: ${result.error.message}`)
  }
}

/** Creates a simple application state store */
export function createAppStore<S>(initialState: S) {
  let state = initialState
  const listeners: ((state: S) => void)[] = []

  return {
    getState(): S {
      return state
    },

    setState(newState: Partial<S>): void {
      state = {...state, ...newState}
      listeners.forEach(listener => listener(state))
    },

    subscribe(listener: (state: S) => void): () => void {
      listeners.push(listener)
      return () => {
        const index = listeners.indexOf(listener)
        if (index > -1) {
          listeners.splice(index, 1)
        }
      }
    },
  }
}

/** Application configuration */
export interface AppConfig {
  apiBaseUrl: string
  debug: boolean
  version: string
}

/** Default configuration */
export const defaultConfig: AppConfig = {
  apiBaseUrl: 'https://api.example.com',
  debug: false,
  version: '1.0.0',
}
