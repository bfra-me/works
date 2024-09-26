import type {
  ParserOptions as PrettierParserOptions,
  SupportOption,
  SupportOptions as PrettierSupportOptions,
} from 'prettier'
import prettier from 'prettier'
import {parsers as babelParsers} from 'prettier/plugins/babel'
import {languages as estreeLanguages} from 'prettier/plugins/estree'
import {sortPackageJson} from 'sort-package-json'

type SortPackageJsonOptions = NonNullable<Parameters<typeof sortPackageJson>[1]>

export type PrettierPackageJsonOptions = {
  /** Custom ordering array or comparator function. */
  sortPackageJsonSortOrder?: SortPackageJsonOptions['sortOrder']
}

export type ParserOptions<T = any> = PrettierParserOptions<T> & PrettierPackageJsonOptions

const languages = estreeLanguages.filter(({name}) => name === 'JSON.stringify')

export type SupportOptions = PrettierSupportOptions & {
  [_ in keyof PrettierPackageJsonOptions]: SupportOption
}

const options: SupportOptions = {
  sortPackageJsonSortOrder: {
    category: 'JavaScript',
    type: 'string',
    description: 'Custom ordering array.',
    default: [{value: [] as string[]}],
    array: true,
  },
}

const parser = babelParsers['json-stringify']

const parsers: Partial<typeof babelParsers> = {
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

export {languages, options, parsers}
