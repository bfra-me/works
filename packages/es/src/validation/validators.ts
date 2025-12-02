const EMAIL_REGEX = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const SEMVER_REGEX =
  /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-(?:0|[1-9]\d*|\d*[a-z-][0-9a-z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-z-][0-9a-z-]*))*)?(?:\+[0-9a-z-]+(?:\.[0-9a-z-]+)*)?$/i

/**
 * Validates an email address format.
 */
export function isEmail(value: string): boolean {
  return EMAIL_REGEX.test(value)
}

/**
 * Validates a URL format.
 */
export function isUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.href.length > 0
  } catch {
    return false
  }
}

/**
 * Validates a UUID format.
 */
export function isUuid(value: string): boolean {
  return UUID_REGEX.test(value)
}

/**
 * Validates a semantic version format.
 */
export function isSemver(value: string): boolean {
  return SEMVER_REGEX.test(value)
}
