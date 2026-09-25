/**
 * Tests for parser type guards and validation functions.
 *
 * These tests pin the exact true/false truth table for every guard in
 * `src/parsers/guards.ts`, including the array-property checks that were
 * refactored to use `isArray` from `@bfra.me/es/types` instead of relying on
 * TypeScript's `Array.isArray` (which widens to `any[]`).
 */

import {describe, expect, it} from 'vitest'

import {
  assertPackageAPI,
  assertPackageInfo,
  assertParseError,
  isDocConfigSource,
  isExportedFunction,
  isExportedType,
  isJSDocInfo,
  isJSDocParam,
  isJSDocTag,
  isMDXFrontmatter,
  isPackageAPI,
  isPackageInfo,
  isParseError,
  isReadmeContent,
  isReadmeSection,
  isReExport,
  isSafeContent,
  isSafeFilePath,
  isSyncError,
  isValidHeadingLevel,
  isValidPackageName,
  isValidSemver,
} from '../../src/parsers/guards'

describe('guards', () => {
  describe('isParseError', () => {
    it.concurrent('returns true for a minimal valid ParseError', () => {
      expect(isParseError({code: 'FILE_NOT_FOUND', message: 'not found'})).toBe(true)
    })

    it.concurrent('returns true for a fully populated ParseError', () => {
      expect(
        isParseError({
          code: 'INVALID_SYNTAX',
          message: 'bad syntax',
          filePath: '/a.ts',
          line: 1,
          column: 2,
          cause: new Error('root cause'),
        }),
      ).toBe(true)
    })

    it.concurrent('returns false for non-objects', () => {
      expect(isParseError(null)).toBe(false)
      expect(isParseError(undefined)).toBe(false)
      expect(isParseError('string')).toBe(false)
      expect(isParseError(42)).toBe(false)
    })

    it.concurrent('returns false when code is missing or wrong type', () => {
      expect(isParseError({message: 'no code'})).toBe(false)
      expect(isParseError({code: 123, message: 'wrong type'})).toBe(false)
    })

    it.concurrent('returns false when message is missing or wrong type', () => {
      expect(isParseError({code: 'FILE_NOT_FOUND'})).toBe(false)
      expect(isParseError({code: 'FILE_NOT_FOUND', message: 42})).toBe(false)
    })

    it.concurrent('returns false for an unrecognized code', () => {
      expect(isParseError({code: 'NOT_A_REAL_CODE', message: 'oops'})).toBe(false)
    })
  })

  describe('isSyncError', () => {
    it.concurrent('returns true for a minimal valid SyncError', () => {
      expect(isSyncError({code: 'WRITE_ERROR', message: 'failed to write'})).toBe(true)
    })

    it.concurrent('returns true for a fully populated SyncError', () => {
      expect(
        isSyncError({
          code: 'CONFIG_ERROR',
          message: 'bad config',
          packageName: '@bfra.me/es',
          filePath: '/a.ts',
          cause: new Error('root cause'),
        }),
      ).toBe(true)
    })

    it.concurrent('returns false for non-objects', () => {
      expect(isSyncError(null)).toBe(false)
      expect(isSyncError([])).toBe(false)
    })

    it.concurrent('returns false for an unrecognized code', () => {
      expect(isSyncError({code: 'FILE_NOT_FOUND', message: 'wrong error family'})).toBe(false)
    })
  })

  describe('isJSDocParam', () => {
    it.concurrent('returns true with only the required name field', () => {
      expect(isJSDocParam({name: 'value'})).toBe(true)
    })

    it.concurrent('returns true with all optional fields populated', () => {
      expect(
        isJSDocParam({
          name: 'value',
          type: 'string',
          description: 'the value',
          optional: true,
          defaultValue: '""',
        }),
      ).toBe(true)
    })

    it.concurrent('returns false when name is missing', () => {
      expect(isJSDocParam({})).toBe(false)
    })

    it.concurrent('returns false when an optional field has the wrong type', () => {
      expect(isJSDocParam({name: 'value', optional: 'yes'})).toBe(false)
      expect(isJSDocParam({name: 'value', type: 123})).toBe(false)
    })

    it.concurrent('returns false for non-objects', () => {
      expect(isJSDocParam(null)).toBe(false)
    })
  })

  describe('isJSDocTag', () => {
    it.concurrent('returns true with only name', () => {
      expect(isJSDocTag({name: 'internal'})).toBe(true)
    })

    it.concurrent('returns true with name and value', () => {
      expect(isJSDocTag({name: 'internal', value: 'true'})).toBe(true)
    })

    it.concurrent('returns false when name is missing or wrong type', () => {
      expect(isJSDocTag({})).toBe(false)
      expect(isJSDocTag({name: 1})).toBe(false)
    })

    it.concurrent('returns false when value has the wrong type', () => {
      expect(isJSDocTag({name: 'internal', value: 1})).toBe(false)
    })
  })

  describe('isJSDocInfo', () => {
    it.concurrent('returns true for an empty object (all fields optional)', () => {
      expect(isJSDocInfo({})).toBe(true)
    })

    it.concurrent('returns true when params is a valid array of JSDocParam', () => {
      expect(isJSDocInfo({params: [{name: 'a'}, {name: 'b', type: 'number'}]})).toBe(true)
    })

    it.concurrent('returns true with an empty params array', () => {
      expect(isJSDocInfo({params: []})).toBe(true)
    })

    it.concurrent('returns false when params contains an invalid entry', () => {
      expect(isJSDocInfo({params: [{name: 'a'}, {bad: true}]})).toBe(false)
    })

    it.concurrent('returns false when params is not an array', () => {
      expect(isJSDocInfo({params: 'not-an-array'})).toBe(false)
    })

    it.concurrent('returns true when examples is a valid string array', () => {
      expect(isJSDocInfo({examples: ['example()', 'another()']})).toBe(true)
    })

    it.concurrent('returns false when examples contains a non-string', () => {
      expect(isJSDocInfo({examples: ['ok', 42]})).toBe(false)
    })

    it.concurrent('returns false when examples is not an array', () => {
      expect(isJSDocInfo({examples: 'nope'})).toBe(false)
    })

    it.concurrent('returns true when see is a valid string array', () => {
      expect(isJSDocInfo({see: ['https://example.com']})).toBe(true)
    })

    it.concurrent('returns false when see contains a non-string', () => {
      expect(isJSDocInfo({see: [1, 2]})).toBe(false)
    })

    it.concurrent('returns true when customTags is a valid array of JSDocTag', () => {
      expect(isJSDocInfo({customTags: [{name: 'internal'}]})).toBe(true)
    })

    it.concurrent('returns false when customTags contains an invalid entry', () => {
      expect(isJSDocInfo({customTags: [{}]})).toBe(false)
    })

    it.concurrent('returns true for a fully populated object', () => {
      expect(
        isJSDocInfo({
          description: 'desc',
          params: [{name: 'a'}],
          returns: 'void',
          examples: ['foo()'],
          deprecated: 'use bar instead',
          since: '1.0.0',
          see: ['https://example.com'],
          customTags: [{name: 'internal', value: 'true'}],
        }),
      ).toBe(true)
    })

    it.concurrent('returns false when a scalar field has the wrong type', () => {
      expect(isJSDocInfo({description: 42})).toBe(false)
      expect(isJSDocInfo({returns: 42})).toBe(false)
      expect(isJSDocInfo({deprecated: 42})).toBe(false)
      expect(isJSDocInfo({since: 42})).toBe(false)
    })

    it.concurrent('returns false for non-objects', () => {
      expect(isJSDocInfo(null)).toBe(false)
    })
  })

  describe('isExportedFunction', () => {
    const base = {
      name: 'foo',
      signature: '(a: string) => void',
      isAsync: false,
      isGenerator: false,
      parameters: [],
      returnType: 'void',
      isDefault: false,
    }

    it.concurrent('returns true for a minimal valid ExportedFunction', () => {
      expect(isExportedFunction(base)).toBe(true)
    })

    it.concurrent('returns true with a non-empty parameters array', () => {
      expect(
        isExportedFunction({...base, parameters: [{name: 'a', type: 'string', optional: false}]}),
      ).toBe(true)
    })

    it.concurrent('returns false when parameters is not an array', () => {
      expect(isExportedFunction({...base, parameters: 'nope'})).toBe(false)
    })

    it.concurrent('returns false when a required boolean field is missing', () => {
      const missingIsAsync: Record<string, unknown> = {...base}
      delete missingIsAsync.isAsync
      expect(isExportedFunction(missingIsAsync)).toBe(false)
    })

    it.concurrent('returns false when a required string field has the wrong type', () => {
      expect(isExportedFunction({...base, name: 1})).toBe(false)
      expect(isExportedFunction({...base, signature: 1})).toBe(false)
      expect(isExportedFunction({...base, returnType: 1})).toBe(false)
    })

    it.concurrent('returns false for non-objects', () => {
      expect(isExportedFunction(undefined)).toBe(false)
    })
  })

  describe('isExportedType', () => {
    const base = {
      name: 'Foo',
      definition: 'interface Foo {}',
      kind: 'interface',
      isDefault: false,
    }

    it.concurrent('returns true for each valid kind', () => {
      for (const kind of ['interface', 'type', 'enum', 'class']) {
        expect(isExportedType({...base, kind})).toBe(true)
      }
    })

    it.concurrent('returns false for an invalid kind', () => {
      expect(isExportedType({...base, kind: 'namespace'})).toBe(false)
    })

    it.concurrent('returns false when a required field is missing', () => {
      expect(isExportedType({name: 'Foo'})).toBe(false)
    })

    it.concurrent('returns false for non-objects', () => {
      expect(isExportedType(null)).toBe(false)
    })
  })

  describe('isReExport', () => {
    it.concurrent('returns true when exports is the "*" sentinel', () => {
      expect(isReExport({from: './mod', exports: '*'})).toBe(true)
    })

    it.concurrent('returns true when exports is a valid string array', () => {
      expect(isReExport({from: './mod', exports: ['a', 'b']})).toBe(true)
    })

    it.concurrent('returns true with an empty exports array', () => {
      expect(isReExport({from: './mod', exports: []})).toBe(true)
    })

    it.concurrent('returns false when exports contains a non-string', () => {
      expect(isReExport({from: './mod', exports: ['a', 1]})).toBe(false)
    })

    it.concurrent('returns false when exports is neither "*" nor an array', () => {
      expect(isReExport({from: './mod', exports: 'a'})).toBe(false)
    })

    it.concurrent('returns false when from is missing or wrong type', () => {
      expect(isReExport({exports: '*'})).toBe(false)
      expect(isReExport({from: 1, exports: '*'})).toBe(false)
    })

    it.concurrent('returns false for non-objects', () => {
      expect(isReExport(null)).toBe(false)
    })
  })

  describe('isPackageAPI', () => {
    const validFunction = {
      name: 'foo',
      signature: '() => void',
      isAsync: false,
      isGenerator: false,
      parameters: [],
      returnType: 'void',
      isDefault: false,
    }
    const validType = {name: 'Foo', definition: 'type Foo = string', kind: 'type', isDefault: false}
    const validReExport = {from: './mod', exports: '*'}

    it.concurrent('returns true when all arrays are empty', () => {
      expect(isPackageAPI({functions: [], types: [], reExports: []})).toBe(true)
    })

    it.concurrent('returns true when all arrays contain valid entries', () => {
      expect(
        isPackageAPI({
          functions: [validFunction],
          types: [validType],
          reExports: [validReExport],
        }),
      ).toBe(true)
    })

    it.concurrent('returns false when functions is not an array', () => {
      expect(isPackageAPI({functions: 'nope', types: [], reExports: []})).toBe(false)
    })

    it.concurrent('returns false when functions contains an invalid entry', () => {
      expect(isPackageAPI({functions: [{}], types: [], reExports: []})).toBe(false)
    })

    it.concurrent('returns false when types is not an array', () => {
      expect(isPackageAPI({functions: [], types: 'nope', reExports: []})).toBe(false)
    })

    it.concurrent('returns false when types contains an invalid entry', () => {
      expect(isPackageAPI({functions: [], types: [{}], reExports: []})).toBe(false)
    })

    it.concurrent('returns false when reExports is not an array', () => {
      expect(isPackageAPI({functions: [], types: [], reExports: 'nope'})).toBe(false)
    })

    it.concurrent('returns false when reExports contains an invalid entry', () => {
      expect(isPackageAPI({functions: [], types: [], reExports: [{}]})).toBe(false)
    })

    it.concurrent('returns false when a required array is missing', () => {
      expect(isPackageAPI({functions: [], types: []})).toBe(false)
    })

    it.concurrent('returns false for non-objects', () => {
      expect(isPackageAPI(null)).toBe(false)
    })
  })

  describe('isDocConfigSource', () => {
    it.concurrent('returns true for an empty object (all fields optional)', () => {
      expect(isDocConfigSource({})).toBe(true)
    })

    it.concurrent('returns true for a fully populated object', () => {
      expect(
        isDocConfigSource({
          title: 'Title',
          description: 'Description',
          sidebar: {label: 'Docs', order: 1, hidden: false},
          excludeSections: ['License'],
          frontmatter: {custom: 'value'},
        }),
      ).toBe(true)
    })

    it.concurrent('returns true with an empty excludeSections array', () => {
      expect(isDocConfigSource({excludeSections: []})).toBe(true)
    })

    it.concurrent('returns false when excludeSections contains a non-string', () => {
      expect(isDocConfigSource({excludeSections: ['ok', 1]})).toBe(false)
    })

    it.concurrent('returns false when excludeSections is not an array', () => {
      expect(isDocConfigSource({excludeSections: 'nope'})).toBe(false)
    })

    it.concurrent('returns false when title has the wrong type', () => {
      expect(isDocConfigSource({title: 42})).toBe(false)
    })

    it.concurrent('returns false for non-objects', () => {
      expect(isDocConfigSource(null)).toBe(false)
    })
  })

  describe('isPackageInfo', () => {
    const base = {
      name: '@bfra.me/es',
      version: '1.0.0',
      packagePath: '/packages/es',
      srcPath: '/packages/es/src',
    }

    it.concurrent('returns true for a minimal valid PackageInfo', () => {
      expect(isPackageInfo(base)).toBe(true)
    })

    it.concurrent('returns true with a valid keywords array', () => {
      expect(isPackageInfo({...base, keywords: ['typescript', 'utilities']})).toBe(true)
    })

    it.concurrent('returns true with an empty keywords array', () => {
      expect(isPackageInfo({...base, keywords: []})).toBe(true)
    })

    it.concurrent('returns false when keywords contains a non-string', () => {
      expect(isPackageInfo({...base, keywords: ['ok', 1]})).toBe(false)
    })

    it.concurrent('returns false when keywords is not an array', () => {
      expect(isPackageInfo({...base, keywords: 'nope'})).toBe(false)
    })

    it.concurrent('returns true with a valid docsConfig', () => {
      expect(isPackageInfo({...base, docsConfig: {title: 'Custom'}})).toBe(true)
    })

    it.concurrent('returns false with an invalid docsConfig', () => {
      expect(isPackageInfo({...base, docsConfig: {excludeSections: [1]}})).toBe(false)
    })

    it.concurrent('returns false when a required field is missing', () => {
      const missingSrcPath: Record<string, unknown> = {...base}
      delete missingSrcPath.srcPath
      expect(isPackageInfo(missingSrcPath)).toBe(false)
    })

    it.concurrent('returns false for non-objects', () => {
      expect(isPackageInfo(null)).toBe(false)
    })
  })

  describe('isReadmeSection', () => {
    const base = {heading: 'Usage', level: 2, content: 'Some content', children: []}

    it.concurrent('returns true for a leaf section with no children', () => {
      expect(isReadmeSection(base)).toBe(true)
    })

    it.concurrent('returns true for a section with valid nested children', () => {
      expect(
        isReadmeSection({
          ...base,
          children: [{heading: 'Sub', level: 3, content: 'nested', children: []}],
        }),
      ).toBe(true)
    })

    it.concurrent('returns false when a nested child is invalid', () => {
      expect(isReadmeSection({...base, children: [{heading: 'Sub'}]})).toBe(false)
    })

    it.concurrent('returns false when children is not an array', () => {
      expect(isReadmeSection({...base, children: 'nope'})).toBe(false)
    })

    it.concurrent('returns true at the level boundaries (1 and 6)', () => {
      expect(isReadmeSection({...base, level: 1})).toBe(true)
      expect(isReadmeSection({...base, level: 6})).toBe(true)
    })

    it.concurrent('returns false when level is out of range', () => {
      expect(isReadmeSection({...base, level: 0})).toBe(false)
      expect(isReadmeSection({...base, level: 7})).toBe(false)
    })

    it.concurrent('returns false when a required field has the wrong type', () => {
      expect(isReadmeSection({...base, heading: 1})).toBe(false)
      expect(isReadmeSection({...base, content: 1})).toBe(false)
    })

    it.concurrent('returns false for non-objects', () => {
      expect(isReadmeSection(null)).toBe(false)
    })
  })

  describe('isReadmeContent', () => {
    const validSection = {heading: 'Usage', level: 2, content: 'content', children: []}

    it.concurrent('returns true for a minimal valid ReadmeContent', () => {
      expect(isReadmeContent({sections: [], raw: '# Title'})).toBe(true)
    })

    it.concurrent('returns true with populated optional fields and sections', () => {
      expect(
        isReadmeContent({
          title: 'Title',
          preamble: 'Intro text',
          sections: [validSection],
          raw: '# Title\n\n## Usage\n\ncontent',
        }),
      ).toBe(true)
    })

    it.concurrent('returns false when sections contains an invalid entry', () => {
      expect(isReadmeContent({sections: [{heading: 'Usage'}], raw: 'raw'})).toBe(false)
    })

    it.concurrent('returns false when sections is not an array', () => {
      expect(isReadmeContent({sections: 'nope', raw: 'raw'})).toBe(false)
    })

    it.concurrent('returns false when raw is missing or wrong type', () => {
      expect(isReadmeContent({sections: []})).toBe(false)
      expect(isReadmeContent({sections: [], raw: 42})).toBe(false)
    })

    it.concurrent('returns false when an optional field has the wrong type', () => {
      expect(isReadmeContent({sections: [], raw: 'raw', title: 42})).toBe(false)
      expect(isReadmeContent({sections: [], raw: 'raw', preamble: 42})).toBe(false)
    })

    it.concurrent('returns false for non-objects', () => {
      expect(isReadmeContent(null)).toBe(false)
    })
  })

  describe('isMDXFrontmatter', () => {
    it.concurrent('returns true with only the required title', () => {
      expect(isMDXFrontmatter({title: 'Page Title'})).toBe(true)
    })

    it.concurrent('returns true with all optional fields populated', () => {
      expect(
        isMDXFrontmatter({
          title: 'Page Title',
          description: 'Description',
          sidebar: {label: 'Docs'},
          tableOfContents: true,
          template: 'doc',
        }),
      ).toBe(true)
    })

    it.concurrent('returns true when tableOfContents is an object', () => {
      expect(
        isMDXFrontmatter({title: 'T', tableOfContents: {minHeadingLevel: 2, maxHeadingLevel: 4}}),
      ).toBe(true)
    })

    it.concurrent('returns false when tableOfContents has the wrong type', () => {
      expect(isMDXFrontmatter({title: 'T', tableOfContents: 'yes'})).toBe(false)
    })

    it.concurrent('returns true for each valid template value', () => {
      expect(isMDXFrontmatter({title: 'T', template: 'doc'})).toBe(true)
      expect(isMDXFrontmatter({title: 'T', template: 'splash'})).toBe(true)
    })

    it.concurrent('returns false for an invalid template value', () => {
      expect(isMDXFrontmatter({title: 'T', template: 'blog'})).toBe(false)
    })

    it.concurrent('returns false when title is missing or wrong type', () => {
      expect(isMDXFrontmatter({})).toBe(false)
      expect(isMDXFrontmatter({title: 42})).toBe(false)
    })

    it.concurrent('returns false for non-objects', () => {
      expect(isMDXFrontmatter(null)).toBe(false)
    })
  })

  describe('isValidPackageName', () => {
    it.concurrent('returns true for a simple unscoped name', () => {
      expect(isValidPackageName('lodash')).toBe(true)
    })

    it.concurrent('returns true for a valid scoped name', () => {
      expect(isValidPackageName('@bfra.me/es')).toBe(true)
    })

    it.concurrent('returns false for an empty string', () => {
      expect(isValidPackageName('')).toBe(false)
    })

    it.concurrent('returns false when starting with a dot or underscore', () => {
      expect(isValidPackageName('.hidden')).toBe(false)
      expect(isValidPackageName('_private')).toBe(false)
    })

    it.concurrent('returns false for a scope with no slash or empty scope/name', () => {
      expect(isValidPackageName('@scope')).toBe(false)
      expect(isValidPackageName('@/name')).toBe(false)
      expect(isValidPackageName('@scope/')).toBe(false)
    })

    it.concurrent('returns false when the scope or package segment is invalid', () => {
      expect(isValidPackageName('@sc ope/name')).toBe(false)
      expect(isValidPackageName('@scope/na me')).toBe(false)
    })
  })

  describe('isValidSemver', () => {
    it.concurrent('returns true for a bare major.minor.patch version', () => {
      expect(isValidSemver('1.2.3')).toBe(true)
    })

    it.concurrent('returns true with a prerelease and/or build metadata', () => {
      expect(isValidSemver('1.2.3-beta.1')).toBe(true)
      expect(isValidSemver('1.2.3+build.5')).toBe(true)
      expect(isValidSemver('1.2.3-beta.1+build.5')).toBe(true)
    })

    it.concurrent('returns false for malformed versions', () => {
      expect(isValidSemver('1.2')).toBe(false)
      expect(isValidSemver('v1.2.3')).toBe(false)
      expect(isValidSemver('not-a-version')).toBe(false)
    })
  })

  describe('isValidHeadingLevel', () => {
    it.concurrent('returns true for integers 1 through 6', () => {
      for (let level = 1; level <= 6; level++) {
        expect(isValidHeadingLevel(level)).toBe(true)
      }
    })

    it.concurrent('returns false for out-of-range integers', () => {
      expect(isValidHeadingLevel(0)).toBe(false)
      expect(isValidHeadingLevel(7)).toBe(false)
    })

    it.concurrent('returns false for non-integers', () => {
      expect(isValidHeadingLevel(2.5)).toBe(false)
    })
  })

  describe('isSafeContent', () => {
    it.concurrent('returns true for plain text', () => {
      expect(isSafeContent('Hello, world!')).toBe(true)
    })

    it.concurrent('returns false for content with a script tag', () => {
      expect(isSafeContent('<script>alert(1)</script>')).toBe(false)
    })

    it.concurrent('returns false for a javascript: URI', () => {
      expect(isSafeContent('javascript:alert(1)')).toBe(false)
    })

    it.concurrent('returns false for an inline event handler', () => {
      expect(isSafeContent('<img onerror=alert(1)>')).toBe(false)
    })

    it.concurrent('returns false for a data: URI', () => {
      expect(isSafeContent('data:text/html,<script>alert(1)</script>')).toBe(false)
    })

    it.concurrent('returns false for a vbscript: URI', () => {
      expect(isSafeContent('vbscript:msgbox(1)')).toBe(false)
    })
  })

  describe('isSafeFilePath', () => {
    it.concurrent('returns true for a relative path with no traversal', () => {
      expect(isSafeFilePath('src/index.ts')).toBe(true)
    })

    it.concurrent('returns false for a path containing "../"', () => {
      expect(isSafeFilePath('../secrets.env')).toBe(false)
      expect(isSafeFilePath('a/../../b')).toBe(false)
    })

    it.concurrent('returns false for a Windows-style traversal path', () => {
      expect(isSafeFilePath(String.raw`a\..\b`)).toBe(false)
    })

    it.concurrent('returns true for an already-absolute Unix path', () => {
      // The function only rejects paths that *become* absolute after
      // backslash normalization; a literally-leading '/' is left alone.
      expect(isSafeFilePath('/etc/passwd')).toBe(true)
    })

    it.concurrent('returns false for a Windows-style absolute path disguised as relative', () => {
      expect(isSafeFilePath(String.raw`\etc\passwd`)).toBe(false)
    })

    it.concurrent(
      'returns true for a path with redundant separators or a leading dot segment',
      () => {
        expect(isSafeFilePath('//etc/passwd')).toBe(true)
        expect(isSafeFilePath('./src/index.ts')).toBe(true)
      },
    )
  })

  describe('assertParseError', () => {
    it.concurrent('does not throw for a valid ParseError', () => {
      expect(() => assertParseError({code: 'FILE_NOT_FOUND', message: 'missing'})).not.toThrow()
    })

    it.concurrent('throws for an invalid value', () => {
      expect(() => assertParseError({})).toThrow(TypeError)
    })
  })

  describe('assertPackageInfo', () => {
    it.concurrent('does not throw for a valid PackageInfo', () => {
      expect(() =>
        assertPackageInfo({
          name: 'pkg',
          version: '1.0.0',
          packagePath: '/pkg',
          srcPath: '/pkg/src',
        }),
      ).not.toThrow()
    })

    it.concurrent('throws for an invalid value', () => {
      expect(() => assertPackageInfo({})).toThrow(TypeError)
    })
  })

  describe('assertPackageAPI', () => {
    it.concurrent('does not throw for a valid PackageAPI', () => {
      expect(() => assertPackageAPI({functions: [], types: [], reExports: []})).not.toThrow()
    })

    it.concurrent('throws for an invalid value', () => {
      expect(() => assertPackageAPI({})).toThrow(TypeError)
    })
  })
})
