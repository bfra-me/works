import type {Config} from '../config'
import {anyParser} from '../parsers/any-parser'
import {requireOf} from '../require-of'
import {interopDefault} from '../utils'
import {fallback} from './fallback'

export async function jsonSchema(name: string, files: string[]): Promise<Config[]> {
  return requireOf(
    ['eslint-plugin-json-schema-validator'],
    async () => {
      const pluginJsonSchemaValidator = await interopDefault(
        import('eslint-plugin-json-schema-validator'),
      )
      return [
        ...pluginJsonSchemaValidator.configs['flat/recommended']
          .map((config: Config) => {
            if (config.files == null) {
              return {...config, files}
            }
            if (config.files.flat().some(file => files.some(suffix => file.endsWith(suffix)))) {
              return config
            }
            return {}
          })
          .filter(o => Object.keys(o).length > 0)
          .map((config: Config, index) => ({
            ...config,
            name: config.plugins
              ? `@bfra.me/${name}/json-schema/plugins`
              : `@bfra.me/${name}/json-schema/${(config.name ?? '') || `unnamed${index}`}`,
          })),
        {
          name: `@bfra.me/${name}/json-schema`,
          files,
          rules: {
            'json-schema-validator/no-invalid': [
              'warn',
              {
                schemas: [
                  {
                    fileMatch: ['.eslintrc.js'],
                    schema: 'https://json.schemastore.org/eslintrc',
                  },
                  {
                    fileMatch: ['.prettierrc.toml'],
                    schema: 'https://json.schemastore.org/prettierrc',
                  },
                  {
                    fileMatch: [
                      'stylelint.config.js',
                      'stylelint.config.cjs',
                      '.stylelintrc.js',
                      '.stylelintrc.yaml',
                      '.stylelintrc.yml',
                    ],
                    schema: 'https://json.schemastore.org/stylelintrc',
                  },
                ],
                useSchemastoreCatalog: true,
              },
            ],
          },
        },
      ]
    },
    async missingList =>
      fallback(missingList, {
        files,
        languageOptions: {parser: anyParser},
      }),
  )
}
