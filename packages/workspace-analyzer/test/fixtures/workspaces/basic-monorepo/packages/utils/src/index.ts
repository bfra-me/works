import type {Result} from '@fixture/core'
import {err, ok} from '@fixture/core'

export function parseJson<T>(json: string): Result<T, Error> {
  try {
    return ok(JSON.parse(json) as T)
  } catch (e) {
    return err(e as Error)
  }
}

export function stringifyJson<T>(data: T): Result<string, Error> {
  try {
    return ok(JSON.stringify(data, null, 2))
  } catch (e) {
    return err(e as Error)
  }
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
