export type Result<T, E> = {success: true; data: T} | {success: false; error: E}

export function ok<T>(data: T): Result<T, never> {
  return {success: true, data}
}

export function err<E>(error: E): Result<never, E> {
  return {success: false, error}
}

export function isOk<T, E>(result: Result<T, E>): result is {success: true; data: T} {
  return result.success === true
}

export function isErr<T, E>(result: Result<T, E>): result is {success: false; error: E} {
  return result.success === false
}

export interface Config {
  readonly name: string
  readonly version: string
  readonly debug?: boolean
}
