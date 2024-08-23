import type {Parser, ParserOptions, Plugin, SupportOption} from 'prettier'
import prettier from 'prettier'
import {parsers as babelParsers} from 'prettier/plugins/babel'
import {sortPackageJson} from 'sort-package-json'

export type SortPackageJsonOptions = NonNullable<Parameters<typeof sortPackageJson>[1]>

export type PrettierPackageJsonOptions = {
  /** Custom ordering array or comparator function. */
  sortPackageJsonSortOrder?: SortPackageJsonOptions['sortOrder']
}

export type PrettierOptions = ParserOptions & PrettierPackageJsonOptions

export const options = {
  sortPackageJsonSortOrder: {
    category: 'Format',
    type: 'string',
    description: 'Custom ordering array.',
    default: [{value: [] as string[]}],
    array: true,
  },
} satisfies Record<keyof PrettierPackageJsonOptions, SupportOption>

const parser = babelParsers['json-stringify']

export const parsers = {
  'json-stringify': {
    ...parser,

    async parse(text: string, options: PrettierOptions) {
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
} satisfies Record<string, Parser>

const PackageJsonPlugin: Plugin<string> = {
  parsers,
  options,
}

export default PackageJsonPlugin
