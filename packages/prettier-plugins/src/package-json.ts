import type {Writable as Writeable} from 'type-fest'
import prettier from 'prettier'
import {parsers as babelParsers} from 'prettier/plugins/babel'
import estree from 'prettier/plugins/estree'
import {sortPackageJson} from 'sort-package-json'

export type SortPackageJsonOptions = NonNullable<Parameters<typeof sortPackageJson>[1]>

export interface PrettierPackageJsonOptions {
  /** Custom ordering array. */
  sortPackageJsonSortOrder: Extract<Writeable<SortPackageJsonOptions['sortOrder']>, string[]>
}

export interface PrettierPackageJsonSupportOptions extends prettier.SupportOptions {
  sortPackageJsonSortOrder: prettier.StringArraySupportOption
}

export const options: PrettierPackageJsonSupportOptions = {
  sortPackageJsonSortOrder: {
    category: 'Format',
    type: 'string',
    description: 'Custom ordering array.',
    default: [{value: [] as string[]}],
    array: true,
  },
}

export interface ParserOptions<T = any>
  extends prettier.ParserOptions<T>,
    Partial<PrettierPackageJsonOptions> {}

const {languages: estreeLanguages} = estree as {languages: prettier.SupportLanguage[]}
export const languages = estreeLanguages.filter(({name}) => name === 'JSON.stringify')

const parser = babelParsers['json-stringify']

export const parsers: Partial<typeof babelParsers> = {
  'json-stringify': {
    ...parser,

    async parse(text: string, options: ParserOptions) {
      const {filepath} = options
      if (/package.*json$/u.test(filepath)) {
        // Format the text with prettier to avoid any parsing errors
        text = await prettier.format(text, {filepath})

        if (parser.preprocess) {
          text = parser.preprocess(text, options)
        }

        const sortOrder = options?.sortPackageJsonSortOrder
        text = sortPackageJson(
          text,
          (sortOrder && sortOrder.length > 0 ? {sortOrder} : {}) as SortPackageJsonOptions,
        )
      }

      return parser.parse(text, options)
    },
  },
}

export interface PrettierPackageJsonPlugin extends prettier.Plugin {}

export const pluginPackageJson: PrettierPackageJsonPlugin = {
  languages,
  options,
  parsers,
} as prettier.Plugin

export default pluginPackageJson
