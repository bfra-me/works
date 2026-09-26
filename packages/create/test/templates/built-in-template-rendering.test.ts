/* eslint-disable no-console */
import type {TemplateContext} from '../../src/types.js'
import {existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync} from 'node:fs'
import {createRequire} from 'node:module'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import ts from 'typescript'
import {afterAll, beforeAll, describe, expect, it} from 'vitest'
import {TemplateProcessor} from '../../src/templates/processor.js'

const CURRENT_DIRNAME = path.dirname(fileURLToPath(import.meta.url))
const PACKAGE_ROOT = path.resolve(CURRENT_DIRNAME, '..', '..')
const TEMPLATES_DIR = path.join(PACKAGE_ROOT, 'templates')
const RENDER_ROOT = path.join(PACKAGE_ROOT, '.tmp', 'built-in-template-rendering-test')
const nodeRequire = createRequire(import.meta.url)

/**
 * The set of built-in templates that ship in `dist/templates` is defined by
 * `templateDirs` in tsup.config.ts (it drives what gets copied at build
 * time). Reading it here instead of hardcoding a second list means adding a
 * template there (e.g. re-enabling `works` once its fate is decided) is
 * picked up automatically, with zero changes needed in this test.
 */
function getShippedTemplateNames(): string[] {
  const source = readFileSync(path.join(PACKAGE_ROOT, 'tsup.config.ts'), 'utf-8')
  const match = /const templateDirs = \[([\s\S]*?)\]/.exec(source)
  if (match == null || match[1] == null || match[1].length === 0) {
    throw new Error('Could not find `templateDirs` array in tsup.config.ts')
  }
  const names = [...match[1].matchAll(/'([^']+)'/g)]
    .map(entry => entry[1])
    .filter((name): name is string => name != null)
  if (names.length === 0) {
    throw new Error('`templateDirs` array in tsup.config.ts resolved to an empty list')
  }
  return names
}

const TEMPLATE_NAMES = getShippedTemplateNames()

function listFilesRecursive(dir: string): string[] {
  const results: string[] = []
  for (const entry of readdirSync(dir)) {
    const fullPath = path.join(dir, entry)
    if (statSync(fullPath).isDirectory()) {
      results.push(...listFilesRecursive(fullPath))
    } else {
      results.push(fullPath)
    }
  }
  return results
}

function getRenderedDir(renderedDirs: Map<string, string>, templateName: string): string {
  const dir = renderedDirs.get(templateName)
  if (dir == null) {
    throw new Error(`Template "${templateName}" was not rendered`)
  }
  return dir
}

/**
 * Mirrors the TemplateContext that `createPackage()` in src/index.ts builds
 * for a real invocation (including the helper functions it exposes on
 * `it.variables`), so this test renders through the exact same Eta context
 * shape a real `create` run would use.
 */
function buildRealTemplateContext(projectName: string): TemplateContext {
  const kebabCase = (str: string) =>
    str
      .replaceAll(/([a-z])([A-Z])/g, '$1-$2')
      .replaceAll(/[\s_]+/g, '-')
      .toLowerCase()
  const camelCase = (str: string) =>
    str
      .replaceAll(/^\w|[A-Z]|\b\w/g, (word, index) =>
        index === 0 ? word.toLowerCase() : word.toUpperCase(),
      )
      .replaceAll(/\s+/g, '')
  const pascalCase = (str: string) =>
    str.replaceAll(/^\w|[A-Z]|\b\w/g, word => word.toUpperCase()).replaceAll(/\s+/g, '')
  const snakeCase = (str: string) =>
    str
      .replaceAll(/([a-z])([A-Z])/g, '$1_$2')
      .replaceAll(/[\s-]+/g, '_')
      .toLowerCase()

  const description = 'A sample project generated for template rendering tests'
  const author = 'Test Author'
  const version = '0.1.0'

  return {
    projectName,
    description,
    author,
    version,
    packageManager: 'pnpm',
    variables: {
      name: projectName,
      description,
      author,
      version,
      year: new Date().getFullYear(),
      date: new Date().toISOString().split('T')[0],
      kebabCase,
      camelCase,
      pascalCase,
      snakeCase,
    },
  }
}

interface DuplicateKey {
  path: string
  key: string
}

/**
 * `JSON.parse` silently keeps the last value for a duplicate key, so it
 * cannot detect the class of bug this test guards against (e.g. two
 * `"build"` entries under `scripts`). This is a minimal duplicate-aware
 * scan: it walks the raw JSON text the same way a parser would, but records
 * every key seen per object instead of building a value.
 */
function findDuplicateJsonKeys(text: string): DuplicateKey[] {
  const duplicates: DuplicateKey[] = []
  let i = 0
  const n = text.length

  function skipWhitespace(): void {
    while (i < n && /\s/.test(text.charAt(i))) i++
  }

  function parseString(): string {
    let result = ''
    i++ // opening quote
    while (i < n && text[i] !== '"') {
      if (text[i] === '\\') {
        result += text.charAt(i) + text.charAt(i + 1)
        i += 2
      } else {
        result += text.charAt(i)
        i++
      }
    }
    i++ // closing quote
    return result
  }

  function parseValue(keyPath: string): void {
    skipWhitespace()
    if (text[i] === '{') {
      parseObject(keyPath)
    } else if (text[i] === '[') {
      parseArray(keyPath)
    } else if (text[i] === '"') {
      parseString()
    } else {
      while (i < n && !',}]'.includes(text.charAt(i)) && !/\s/.test(text.charAt(i))) i++
    }
  }

  function parseObject(keyPath: string): void {
    i++ // {
    const seen = new Set<string>()
    skipWhitespace()
    while (i < n && text[i] !== '}') {
      skipWhitespace()
      if (text[i] !== '"') break
      const key = parseString()
      if (seen.has(key)) {
        duplicates.push({path: keyPath.length > 0 ? keyPath : '<root>', key})
      } else {
        seen.add(key)
      }
      skipWhitespace()
      if (text[i] === ':') i++
      parseValue(keyPath.length > 0 ? `${keyPath}.${key}` : key)
      skipWhitespace()
      if (text[i] === ',') {
        i++
        continue
      }
      break
    }
    if (text[i] === '}') i++
  }

  function parseArray(keyPath: string): void {
    i++ // [
    let index = 0
    skipWhitespace()
    while (i < n && text[i] !== ']') {
      parseValue(`${keyPath}[${index}]`)
      index++
      skipWhitespace()
      if (text[i] === ',') {
        i++
        skipWhitespace()
        continue
      }
      break
    }
    if (text[i] === ']') i++
  }

  parseValue('')
  return duplicates
}

const CONFIG_FILE_PATTERN = /\.config\.tsx?$/i
const MISSING_MODULE_CODES = new Set([2307, 2792])

/**
 * Some shipped templates depend on packages this monorepo never installs
 * (e.g. the react template's `@vitejs/plugin-react`, since nothing here
 * builds React apps). Type-checking those files will always report the
 * import as unresolvable. Rather than hardcode a package allowlist, treat a
 * "cannot find module" diagnostic as expected/ignorable only when the
 * specifier genuinely does not resolve from this repo's node_modules -
 * a real regression (e.g. a typo'd import of a package we DO have) still
 * fails the test.
 */
function unresolvableSpecifier(diagnostic: ts.Diagnostic): string | undefined {
  if (diagnostic.file == null || !MISSING_MODULE_CODES.has(diagnostic.code)) return undefined
  const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
  const match = /Cannot find module '([^']+)'/.exec(message)
  if (match == null || match[1] == null || match[1].length === 0) return undefined
  const specifier = match[1]
  try {
    nodeRequire.resolve(specifier, {paths: [path.dirname(diagnostic.file.fileName)]})
    return undefined
  } catch {
    return specifier
  }
}

function formatDiagnostic(diagnostic: ts.Diagnostic): string {
  const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
  if (diagnostic.file != null && diagnostic.start !== undefined) {
    const {line, character} = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start)
    const relativePath = path.relative(PACKAGE_ROOT, diagnostic.file.fileName)
    return `${relativePath}:${line + 1}:${character + 1} TS${diagnostic.code}: ${message}`
  }
  return `TS${diagnostic.code}: ${message}`
}

describe('built-in template rendering', () => {
  const renderedDirs = new Map<string, string>()
  const processor = new TemplateProcessor()

  beforeAll(async () => {
    if (existsSync(RENDER_ROOT)) {
      rmSync(RENDER_ROOT, {recursive: true, force: true})
    }
    mkdirSync(RENDER_ROOT, {recursive: true})

    for (const templateName of TEMPLATE_NAMES) {
      const templatePath = path.join(TEMPLATES_DIR, templateName)
      const outputPath = path.join(RENDER_ROOT, templateName)
      const context = buildRealTemplateContext(`Sample ${templateName} App`)

      // Exercises the real TemplateProcessor used by createPackage() in
      // src/index.ts - same Eta engine config, same file-renaming and
      // extension-stripping logic, same helper functions.
      const result = await processor.process(templatePath, outputPath, context)
      if (!result.success) {
        throw new Error(`Failed to render template "${templateName}": ${String(result.error)}`)
      }

      renderedDirs.set(templateName, outputPath)
    }
  }, 30_000)

  afterAll(() => {
    if (existsSync(RENDER_ROOT)) {
      rmSync(RENDER_ROOT, {recursive: true, force: true})
    }
  })

  it('found at least one shipped template to test', () => {
    expect(TEMPLATE_NAMES.length).toBeGreaterThan(0)
  })

  describe.each(TEMPLATE_NAMES)('template: %s', templateName => {
    it('renders without leaving Eta delimiters in file names or content', () => {
      const dir = getRenderedDir(renderedDirs, templateName)
      const files = listFilesRecursive(dir)
      expect(files.length).toBeGreaterThan(0)

      const leftovers: string[] = []
      for (const file of files) {
        const relativePath = path.relative(dir, file)
        if (/<%|%>/.test(relativePath)) {
          leftovers.push(`file name: ${relativePath}`)
        }
        const content = readFileSync(file, 'utf-8')
        if (/<%|%>/.test(content)) {
          leftovers.push(`file content: ${relativePath}`)
        }
      }
      expect(leftovers).toEqual([])
    })

    it('produces JSON files that parse and contain no duplicate keys', () => {
      const dir = getRenderedDir(renderedDirs, templateName)
      const jsonFiles = listFilesRecursive(dir).filter(file => file.endsWith('.json'))
      expect(jsonFiles.length).toBeGreaterThan(0)

      const problems: string[] = []
      for (const file of jsonFiles) {
        const relativePath = path.relative(dir, file)
        const raw = readFileSync(file, 'utf-8')

        try {
          JSON.parse(raw)
        } catch (error) {
          problems.push(`${relativePath} is not valid JSON: ${String(error)}`)
          continue
        }

        const duplicates = findDuplicateJsonKeys(raw)
        if (duplicates.length > 0) {
          problems.push(`${relativePath} has duplicate keys: ${JSON.stringify(duplicates)}`)
        }
      }
      expect(problems).toEqual([])
    })
  })

  it('kebab-cases the project name for the cli template bin entry', () => {
    if (!renderedDirs.has('cli')) return
    const dir = getRenderedDir(renderedDirs, 'cli')
    const packageJson = JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf-8')) as {
      bin?: Record<string, string>
    }
    expect(packageJson.bin).toHaveProperty('sample-cli-app')
  })

  it("type-checks generated config files against this repo's installed toolchain", () => {
    const configFiles = [...renderedDirs.values()]
      .flatMap(dir => listFilesRecursive(dir))
      .filter(file => CONFIG_FILE_PATTERN.test(file))
    expect(configFiles.length).toBeGreaterThan(0)

    const compilerOptions: ts.CompilerOptions = {
      noEmit: true,
      skipLibCheck: true,
      strict: true,
      esModuleInterop: true,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      // Workspace packages (e.g. @bfra.me/eslint-config) only expose a
      // `source` export condition pointing at TypeScript source; their
      // `lib/` output does not exist until `pnpm build` runs. Vitest's own
      // config resolves workspace packages the same way (see
      // vitest.config.ts's `conditions: ['source']`), so this mirrors that
      // instead of requiring a full build before tests can run.
      customConditions: ['source'],
    }

    const start = performance.now()
    const program = ts.createProgram(configFiles, compilerOptions)

    const failures: string[] = []
    const skipped: string[] = []

    for (const file of configFiles) {
      const sourceFile = program.getSourceFile(file)
      const diagnostics = ts.getPreEmitDiagnostics(program, sourceFile)
      for (const diagnostic of diagnostics) {
        const unresolvable = unresolvableSpecifier(diagnostic)
        if (unresolvable != null) {
          skipped.push(`${path.relative(PACKAGE_ROOT, file)} -> ${unresolvable}`)
          continue
        }
        failures.push(formatDiagnostic(diagnostic))
      }
    }

    const durationMs = performance.now() - start
    console.log(
      `[built-in-template-rendering] type-checked ${configFiles.length} config file(s) in ${durationMs.toFixed(1)}ms`,
    )
    if (skipped.length > 0) {
      console.log(
        `[built-in-template-rendering] skipped ${skipped.length} diagnostic(s) for modules not installed in this repo:\n  ${skipped.join('\n  ')}`,
      )
    }

    expect(failures).toEqual([])
  })
})

describe('findDuplicateJsonKeys', () => {
  it('returns no duplicates for well-formed JSON', () => {
    expect(findDuplicateJsonKeys('{"a": 1, "b": {"c": 2}}')).toEqual([])
  })

  it('detects a duplicate top-level key', () => {
    expect(findDuplicateJsonKeys('{"name": "a", "name": "b"}')).toEqual([
      {path: '<root>', key: 'name'},
    ])
  })

  it('detects a duplicate key nested under "scripts"', () => {
    const json = '{"scripts": {"build": "tsc", "test": "vitest", "build": "tsup"}}'
    expect(findDuplicateJsonKeys(json)).toEqual([{path: 'scripts', key: 'build'}])
  })

  it('does not flag identical keys in sibling objects as duplicates', () => {
    const json = '{"scripts": {"build": "tsc"}, "devDependencies": {"build": "ignored"}}'
    expect(findDuplicateJsonKeys(json)).toEqual([])
  })
})
