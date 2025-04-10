import {spawnSync} from 'node:child_process'
import {existsSync} from 'node:fs'
import {resolve} from 'node:path'
import process from 'node:process'
import {resolveCommand, type AgentName} from 'package-manager-detector'
import {packageDirectorySync} from 'pkg-dir'

const installedModules = new Set<string>()

export function tryInstall(module: string, targetFile: string = process.cwd()) {
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

export function getPackageInstallCommand(module: string, targetFile: string = process.cwd()) {
  const cwd = packageDirectorySync({cwd: targetFile})
  if (!cwd) {
    return null
  }
  const agent = detectPackageManagerSync(cwd)
  if (!agent) {
    return null
  }
  const command = resolveCommand(agent, 'install', ['-D', module])
  return command ? `${command.command} ${command.args.join(' ')}` : null
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
  const manager = detectPackageManagerSync(options.cwd)?.split('@')[0] || 'npm'

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

  if (result.error || result.status !== 0) {
    const errorMessage =
      result.error?.message || `Package installation failed with status ${result.status}`
    throw new Error(errorMessage)
  }

  return `${result.output}`
}

function detectPackageManagerSync(cwd = process.cwd()): AgentName | null {
  // We cannot reliably convert an async detect() to sync detectSync()
  // without potentially blocking. The proper fix would be to make this
  // function async, but that would break API compatibility.
  // For now, we'll use a simple fallback approach:

  try {
    // Look for lockfiles directly
    if (existsSync(resolve(cwd, 'package-lock.json'))) {
      return 'npm'
    }
    if (existsSync(resolve(cwd, 'yarn.lock'))) {
      return 'yarn'
    }
    if (existsSync(resolve(cwd, 'pnpm-lock.yaml'))) {
      return 'pnpm'
    }
    return null
  } catch {
    return null
  }
}
