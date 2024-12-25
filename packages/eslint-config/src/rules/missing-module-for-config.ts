import {spawnSync} from 'node:child_process'
import {existsSync} from 'node:fs'
import {resolve} from 'node:path'
import process from 'node:process'
import {Linter, type Rule} from 'eslint'
import {detectSync} from 'package-manager-detector'
import {packageDirectorySync} from 'pkg-dir'

// Whether to install the missing module(s) for the config
let shouldFix = false

;(function patch() {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const {verify} = Linter.prototype
  Object.defineProperty(Linter.prototype, 'verify', {
    configurable: true,
    value(
      textOrSourceCode: unknown,
      config: unknown,
      options: undefined | {fix?: boolean},
      ...args: unknown[]
    ) {
      shouldFix = Boolean(options && options.fix !== undefined && options.fix)
      return verify.call(this, textOrSourceCode, config, options, ...args)
    },
    writable: true,
  })
})()

export const meta = {
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
    context.report({
      loc: {column: 0, line: 1},
      message: `Missing module for config: ${module}. Run ${output}`,
    })
  }

  return {}
}

const installedModules = new Set()

function tryInstall(module: string, targetFile: string = process.cwd()) {
  if (installedModules.has(module)) {
    return null
  }
  const cwd = packageDirectorySync({cwd: targetFile})
  if (cwd) {
    installedModules.add(module)
    const {moduleName, version} = parseModule(module)
    const result = installPackageSync(moduleName + (version ? `@^${version}` : ''), {
      cwd,
      dev: true,
    })
    return result
  }
  return null
}

function parseModule(name: string) {
  const parts = name.split(/@/u)
  if (parts.length > 1 && parts.slice(0, -1).join('@')) {
    return {
      moduleName: parts.slice(0, -1).join('@'),
      version: parts.at(-1),
    }
  }
  return {moduleName: name, version: null}
}

function installPackageSync(packages: string | string[], options: {cwd: string; dev: boolean}) {
  const detectedManager = detectPackageManagerSync(options.cwd) || 'npm'
  const [manager = 'npm'] = detectedManager.split('@')

  if (!Array.isArray(packages)) {
    packages = [packages]
  }

  const args = []

  if (
    manager === 'pnpm' &&
    existsSync(resolve(options.cwd ?? process.cwd(), 'pnpm-workspace.yaml'))
  ) {
    args.unshift(
      '-w',
      /**
       * Prevent pnpm from removing installed development deps when `NODE_ENV` is `production`
       * @see https://pnpm.io/cli/install#--prod--p
       */
      '--prod=false',
    )
  }
  const result = spawnSync(
    manager,
    [manager === 'yarn' ? 'add' : 'install', options.dev ? '-D' : '', ...args, ...packages].filter(
      Boolean,
    ),
    {cwd: options.cwd, maxBuffer: Infinity, stdio: 'inherit', windowsHide: true},
  )

  if (result.error) {
    throw result.error
  }

  return `${result.output}`
}

function detectPackageManagerSync(cwd = process.cwd()) {
  const result = detectSync({
    cwd,
    onUnknown(packageManager) {
      console.warn(`Unknown package manager: ${packageManager}`)
      return undefined
    },
  })
  return result?.agent || null
}
