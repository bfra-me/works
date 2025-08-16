import consola from 'consola'

export interface RetryOptions {
  maxAttempts: number
  delay: number
  backoff: boolean
  onRetry?: (error: Error, attempt: number) => void
}

export const defaultRetryOptions: RetryOptions = {
  maxAttempts: 3,
  delay: 1000,
  backoff: true,
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {},
): Promise<T> {
  const opts = {...defaultRetryOptions, ...options}
  let lastError: Error | undefined

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      if (attempt === opts.maxAttempts) {
        break
      }

      const delay = opts.backoff ? opts.delay * 2 ** (attempt - 1) : opts.delay

      consola.warn(`Attempt ${attempt} failed: ${lastError.message}`)
      consola.info(`Retrying in ${delay}ms...`)

      opts.onRetry?.(lastError, attempt)

      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError || new Error('Operation failed after all retry attempts')
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase()

  // Network errors
  if (
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('connection')
  ) {
    return true
  }

  // HTTP errors that are retryable
  if (message.includes('502') || message.includes('503') || message.includes('504')) {
    return true
  }

  // Rate limiting
  if (message.includes('rate limit') || message.includes('429')) {
    return true
  }

  return false
}

/**
 * Prompt user for retry action
 */
export async function promptRetry(error: Error): Promise<'retry' | 'skip' | 'abort'> {
  const {select} = await import('@clack/prompts')

  consola.error(`Operation failed: ${error.message}`)

  const action = await select({
    message: 'What would you like to do?',
    options: [
      {value: 'retry', label: 'Retry the operation'},
      {value: 'skip', label: 'Skip this step and continue'},
      {value: 'abort', label: 'Abort the entire process'},
    ],
  })

  return action as 'retry' | 'skip' | 'abort'
}
