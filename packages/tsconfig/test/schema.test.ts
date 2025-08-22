import type {Jsonify, TsConfigJson} from 'type-fest'
import assert from 'node:assert'
import crypto from 'node:crypto'
import {promises as fs} from 'node:fs'
import path from 'node:path'
import Ajv, {type JSONSchemaType} from 'ajv-draft-04'
import {describe, it} from 'vitest'

const SCHEMA_URL = 'https://json.schemastore.org/tsconfig'
const CACHE_DIR = path.join(__dirname, '..', '.cache')

/**
 * Generate a cache filename based on the schema URL
 */
function getCacheFilename(url: string): string {
  const hash = crypto.createHash('md5').update(url).digest('hex')
  return `schema-${hash.slice(0, 8)}.json`
}

/**
 * Load schema from cache if it exists
 */
async function loadSchemaFromCache(url: string): Promise<JSONSchemaType<TsConfigJson> | null> {
  try {
    const cacheFile = path.join(CACHE_DIR, getCacheFilename(url))
    const cacheContent = await fs.readFile(cacheFile, 'utf8')
    return JSON.parse(cacheContent) as JSONSchemaType<TsConfigJson>
  } catch {
    return null
  }
}

/**
 * Save schema to cache
 */
async function saveSchemaToCache(url: string, schema: JSONSchemaType<TsConfigJson>): Promise<void> {
  try {
    await fs.mkdir(CACHE_DIR, {recursive: true})
    const cacheFile = path.join(CACHE_DIR, getCacheFilename(url))
    await fs.writeFile(cacheFile, JSON.stringify(schema, null, 2), 'utf8')
  } catch {
    // Ignore cache save errors
  }
}

/**
 * Fetch schema from URL
 */
async function fetchSchema(url: string): Promise<JSONSchemaType<TsConfigJson>> {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Failed to fetch schema: ${response.status} ${response.statusText}`)
  }

  return (await response.json()) as JSONSchemaType<TsConfigJson>
}

describe('schema', () => {
  it('validates against tsconfig.json schema', async t => {
    const tsconfig = JSON.parse(await fs.readFile('tsconfig.json', 'utf8')) as Jsonify<
      TsConfigJson & {['$schema']?: string}
    >
    const schemaUrl = tsconfig.$schema ?? SCHEMA_URL

    // Try to load schema from cache first
    let schema = await loadSchemaFromCache(schemaUrl)

    if (!schema) {
      // If not in cache, fetch it
      try {
        schema = await fetchSchema(schemaUrl)
        // Save to cache for future use
        await saveSchemaToCache(schemaUrl, schema)
      } catch (error) {
        console.warn(`Failed to fetch schema from ${schemaUrl}:`, error)
        return t.skip()
      }
    }

    const ajv = new Ajv({
      strict: false,
      keywords: ['allowTrailingCommas', 'markdownDescription', 'markdownEnumDescriptions'],
    })
    const validate = ajv.compile(schema)

    assert(validate(tsconfig), 'tsconfig.json does not validate against the schema')
  }, 15000) // 15 second timeout
})
