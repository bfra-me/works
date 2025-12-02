/**
 * CLI package for synthetic monorepo.
 * Demonstrates command-line tool patterns with Result types.
 */

import type {Result} from '@bfra.me/es/result'
import {err, isErr, ok} from '@bfra.me/es/result'

/** CLI command interface */
export interface Command {
  name: string
  description: string
  options?: CommandOption[]
  execute: (args: string[], options: Record<string, string>) => Promise<Result<string, CliError>>
}

/** Command option definition */
export interface CommandOption {
  name: string
  alias?: string
  description: string
  required?: boolean
  defaultValue?: string
}

/** CLI error */
export interface CliError {
  code: 'UNKNOWN_COMMAND' | 'MISSING_OPTION' | 'INVALID_OPTION' | 'EXECUTION_ERROR'
  message: string
  command?: string
}

/** Creates a CLI application */
export function createCli(name: string, version: string) {
  const commands = new Map<string, Command>()

  return {
    name,
    version,

    register(command: Command): void {
      commands.set(command.name, command)
    },

    async run(argv: string[]): Promise<Result<string, CliError>> {
      const [commandName, ...args] = argv

      if (!commandName) {
        return ok(this.help())
      }

      const command = commands.get(commandName)
      if (!command) {
        return err({
          code: 'UNKNOWN_COMMAND',
          message: `Unknown command: ${commandName}`,
          command: commandName,
        })
      }

      const optionResult = parseOptions(args, command.options ?? [])
      if (isErr(optionResult)) {
        return optionResult
      }

      return command.execute(optionResult.data.positional, optionResult.data.options)
    },

    help(): string {
      const lines = [
        `${name} v${version}`,
        '',
        'Commands:',
        ...Array.from(commands.values()).map(cmd => `  ${cmd.name.padEnd(15)} ${cmd.description}`),
      ]
      return lines.join('\n')
    },
  }
}

interface ParsedOptions {
  positional: string[]
  options: Record<string, string>
}

function parseOptions(
  args: string[],
  definitions: CommandOption[],
): Result<ParsedOptions, CliError> {
  const positional: string[] = []
  const options: Record<string, string> = {}

  for (const def of definitions) {
    if (def.defaultValue !== undefined) {
      options[def.name] = def.defaultValue
    }
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === undefined) continue

    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=')
      if (key) {
        options[key] = value ?? args[++i] ?? ''
      }
    } else if (arg.startsWith('-')) {
      const alias = arg.slice(1)
      const def = definitions.find(d => d.alias === alias)
      if (def) {
        options[def.name] = args[++i] ?? ''
      }
    } else {
      positional.push(arg)
    }
  }

  for (const def of definitions) {
    if (def.required && !(def.name in options)) {
      return err({
        code: 'MISSING_OPTION',
        message: `Missing required option: --${def.name}`,
      })
    }
  }

  return ok({positional, options})
}
