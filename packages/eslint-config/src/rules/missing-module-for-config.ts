import {Linter, type Rule} from 'eslint'
import {getPackageInstallCommand, tryInstall} from '../package-utils'

// Whether to install the missing module(s) for the config
let shouldFix = false

;(function patch() {
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

export const meta: Rule.RuleMetaData = {
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

export function create(context: Rule.RuleContext) {
  const [modules] = context.options
  for (const module of modules) {
    let output = ''
    if (shouldFix) {
      const result = tryInstall(module, context.filename || context.getFilename())
      output = result ? `\n${result}` : ''
    }
    const command = getPackageInstallCommand(module, context.filename || context.getFilename())
    context.report({
      loc: {column: 0, line: 1},
      message: `Missing module for config: ${module}. Run: \`${command || `npm i -D ${module}`}\`${output}`,
    })
  }

  return {}
}
