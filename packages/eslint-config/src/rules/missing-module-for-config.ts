import type {RuleContext, RulesMeta} from '@eslint/core'
import {Linter} from 'eslint'
import {getPackageInstallCommand, tryInstall} from '../package-utils'

let shouldFix = false

// Patches Linter.prototype.verify to detect when ESLint runs with --fix flag
;(function patch(): void {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const {verify} = Linter.prototype
  Object.defineProperty(Linter.prototype, 'verify', {
    configurable: true,
    value(...args: Parameters<typeof verify>) {
      const options: Linter.LintOptions | {fix?: boolean} | undefined = args[2]
      shouldFix =
        typeof options === 'object' && options !== null && 'fix' in options && Boolean(options.fix)
      return verify.call(this, ...args)
    },
    writable: true,
  })
})()

export const meta: RulesMeta = {
  docs: {
    description: 'Missing module for config',
    url: 'https://github.com/bfra-me/works',
  },
  fixable: 'code',
  schema: [
    {
      items: {type: 'string'},
      type: 'array',
    },
  ],
  type: 'problem',
}

function buildInstallMessage(module: string, filename: string, errorOutput?: string): string {
  const command = getPackageInstallCommand(module, filename) ?? `npm i -D ${module}`
  const suffix = errorOutput == null ? '' : `\n${errorOutput}`
  return `Missing module for config: ${module}. Run: \`${command}\`${suffix}`
}

export function create(context: RuleContext): Record<string, never> {
  const [modules] = context.options as [string[]]

  for (const module of modules) {
    if (shouldFix) {
      const result = tryInstall(module, context.filename)
      if (result?.success === true) {
        continue
      }
      const errorOutput = result?.success === false ? result.output : undefined
      context.report({
        loc: {column: 0, line: 1},
        message: buildInstallMessage(module, context.filename, errorOutput),
      })
    } else {
      context.report({
        loc: {column: 0, line: 1},
        message: buildInstallMessage(module, context.filename),
      })
    }
  }

  return {}
}
