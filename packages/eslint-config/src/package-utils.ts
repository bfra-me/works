import {spawnSync} from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import {AGENTS, LOCKS, resolveCommand, type AgentName} from 'package-manager-detector'

interface PackageJson {
  packageManager?: string
  devEngines?: {
    packageManager?: {
      name?: string
    }
  }
  [key: string]: unknown
}

const installedModules = new Set<string>()

export function tryInstall(module: string, targetFile: string): string | null {
  if (installedModules.has(module)) {
    return null
  }
  const {moduleName, version} = parseModule(module)
  const packageId = version === undefined ? moduleName : `${moduleName}@^${version}`
  let result
  try {
    result = installPackageSync(packageId, {
      cwd: path.dirname(targetFile),
      dev: true,
    })
  } finally {
    installedModules.add(module)
  }
  return result
}

export function getPackageInstallCommand(module: string, targetFile: string): string | null {
  try {
    const {args, command} = resolvePackageInstallCommand(module, path.dirname(targetFile))
    return `${command} ${args.join(' ')}`
  } catch {
    return null
  }
}

function parseModule(name: string) {
  const parts = name.split(/@/u)
  const hasVersion = parts.length > 1 && parts.slice(0, -1).join('@').length > 0
  if (hasVersion) {
    return {
      moduleName: parts.slice(0, -1).join('@'),
      version: parts.at(-1),
    }
  }
  return {moduleName: name}
}

function resolvePackageInstallCommand(module: string, cwd: string) {
  const agent = detectPackageManagerSync(cwd)
  if (agent == null) {
    throw new Error(`Unable to detect package manager for cwd: ${cwd}`)
  }

  const args: string[] = []

  if (agent === 'pnpm' && fs.existsSync(path.resolve(cwd, 'pnpm-workspace.yaml'))) {
    args.unshift(
      '-w',
      /**
       * Prevent pnpm from removing installed development deps when `NODE_ENV` is `production`
       * @see https://pnpm.io/cli/install#--prod--p
       */
      '--prod=false',
    )
  }

  const command = resolveCommand(agent, 'add', [...args, '-D', module])
  if (command == null) {
    throw new Error(`Unable to resolve command for package manager: ${agent}`)
  }
  return command
}

function installPackageSync(packageId: string, options: {cwd: string; dev: boolean}) {
  const {args, command} = resolvePackageInstallCommand(packageId, options.cwd)
  const result = spawnSync(command, args.filter(Boolean), {
    cwd: options.cwd,
    maxBuffer: Infinity,
    stdio: 'inherit',
    windowsHide: true,
  })

  if (result.error != null || result.status !== 0) {
    const errorMessage =
      result.error?.message ?? `Package installation failed with status ${result.status}`
    throw new Error(errorMessage)
  }

  return result.output?.toString() ?? ''
}

function isAgentName(name: string): name is AgentName {
  return AGENTS.includes(name as AgentName)
}

function getPackageManagerFromPackageJson(cwd: string): AgentName | null {
  try {
    const packageJsonPath = path.join(cwd, 'package.json')
    if (!fs.existsSync(packageJsonPath)) {
      return null
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as PackageJson

    if (typeof packageJson.packageManager === 'string') {
      const [name] = packageJson.packageManager.split('@')
      return name != null && isAgentName(name) ? name : null
    }

    const devEngines = packageJson.devEngines
    if (devEngines != null && typeof devEngines === 'object' && 'packageManager' in devEngines) {
      const pkgManager = devEngines.packageManager
      if (
        pkgManager != null &&
        typeof pkgManager === 'object' &&
        'name' in pkgManager &&
        typeof pkgManager.name === 'string'
      ) {
        return isAgentName(pkgManager.name) ? pkgManager.name : null
      }
    }

    return null
  } catch {
    return null
  }
}

function detectPackageManagerSync(cwd: string): AgentName | null {
  try {
    let directory = path.resolve(cwd)
    const {root} = path.parse(directory)

    while (directory && directory !== root) {
      for (const [lockfile, agent] of Object.entries(LOCKS)) {
        if (fs.existsSync(path.resolve(directory, lockfile))) {
          return getPackageManagerFromPackageJson(directory) ?? agent
        }
      }

      const pkgManager = getPackageManagerFromPackageJson(directory)
      if (pkgManager != null) {
        return pkgManager
      }

      directory = path.dirname(directory)
    }

    return null
  } catch {
    return null
  }
}
