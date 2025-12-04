/**
 * @bfra.me/doc-sync/parsers/typescript-parser - TypeScript source file parser using ts-morph
 */

import type {
  ExportedFunction,
  ExportedType,
  FunctionParameter,
  PackageAPI,
  ParseError,
  ParseResult,
  ReExport,
} from '../types'

import {err, ok} from '@bfra.me/es/result'
import {Project, type SourceFile} from 'ts-morph'

import {extractJSDocInfo} from './jsdoc-extractor'

/**
 * Options for parsing TypeScript source files
 */
export interface TypeScriptParserOptions {
  readonly tsConfigPath?: string
  readonly compilerOptions?: Record<string, unknown>
}

/**
 * Creates a ts-morph project instance for analyzing source files
 */
export function createProject(options?: TypeScriptParserOptions): Project {
  return new Project({
    tsConfigFilePath: options?.tsConfigPath,
    compilerOptions: {
      declaration: true,
      ...(options?.compilerOptions as object),
    },
    skipAddingFilesFromTsConfig: true,
  })
}

/**
 * Parses a TypeScript source file and extracts its structure
 */
export function parseSourceFile(project: Project, filePath: string): ParseResult<SourceFile> {
  try {
    const sourceFile = project.addSourceFileAtPath(filePath)
    return ok(sourceFile)
  } catch (error) {
    return err({
      code: 'FILE_NOT_FOUND',
      message: `Failed to parse source file: ${filePath}`,
      filePath,
      cause: error,
    } satisfies ParseError)
  }
}

/**
 * Parses TypeScript source content from a string
 */
export function parseSourceContent(
  project: Project,
  content: string,
  virtualPath = 'virtual.ts',
): ParseResult<SourceFile> {
  try {
    const sourceFile = project.createSourceFile(virtualPath, content, {
      overwrite: true,
    })
    return ok(sourceFile)
  } catch (error) {
    return err({
      code: 'INVALID_SYNTAX',
      message: 'Failed to parse TypeScript content',
      filePath: virtualPath,
      cause: error,
    } satisfies ParseError)
  }
}

/**
 * Extracts exported functions from a source file
 */
export function extractExportedFunctions(sourceFile: SourceFile): readonly ExportedFunction[] {
  const functions: ExportedFunction[] = []

  for (const func of sourceFile.getFunctions()) {
    if (!func.isExported()) continue

    const name = func.getName() ?? 'default'
    const parameters = extractFunctionParameters(func)
    const returnType = func.getReturnType().getText()
    const jsdoc = extractJSDocInfo(func)

    functions.push({
      name,
      jsdoc,
      signature: func.getSignature()?.getDeclaration().getText() ?? func.getText(),
      isAsync: func.isAsync(),
      isGenerator: func.isGenerator(),
      parameters,
      returnType,
      isDefault: func.isDefaultExport(),
    })
  }

  return functions
}

function extractFunctionParameters(
  func: ReturnType<SourceFile['getFunctions']>[number],
): readonly FunctionParameter[] {
  return func.getParameters().map(param => ({
    name: param.getName(),
    type: param.getType().getText(),
    optional: param.isOptional(),
    defaultValue: param.getInitializer()?.getText(),
  }))
}

/**
 * Extracts exported types and interfaces from a source file
 */
export function extractExportedTypes(sourceFile: SourceFile): readonly ExportedType[] {
  const types: ExportedType[] = []

  // Extract interfaces
  for (const iface of sourceFile.getInterfaces()) {
    if (!iface.isExported()) continue

    const jsdoc = extractJSDocInfo(iface)
    const typeParams = iface.getTypeParameters().map(tp => tp.getText())

    types.push({
      name: iface.getName(),
      jsdoc,
      definition: iface.getText(),
      kind: 'interface',
      isDefault: iface.isDefaultExport(),
      typeParameters: typeParams.length > 0 ? typeParams : undefined,
    })
  }

  // Extract type aliases
  for (const typeAlias of sourceFile.getTypeAliases()) {
    if (!typeAlias.isExported()) continue

    const jsdoc = extractJSDocInfo(typeAlias)
    const typeParams = typeAlias.getTypeParameters().map(tp => tp.getText())

    types.push({
      name: typeAlias.getName(),
      jsdoc,
      definition: typeAlias.getText(),
      kind: 'type',
      isDefault: typeAlias.isDefaultExport(),
      typeParameters: typeParams.length > 0 ? typeParams : undefined,
    })
  }

  // Extract enums
  for (const enumDecl of sourceFile.getEnums()) {
    if (!enumDecl.isExported()) continue

    const jsdoc = extractJSDocInfo(enumDecl)

    types.push({
      name: enumDecl.getName(),
      jsdoc,
      definition: enumDecl.getText(),
      kind: 'enum',
      isDefault: enumDecl.isDefaultExport(),
    })
  }

  // Extract classes
  for (const classDecl of sourceFile.getClasses()) {
    if (!classDecl.isExported()) continue

    const name = classDecl.getName()
    if (name === undefined) continue

    const jsdoc = extractJSDocInfo(classDecl)
    const typeParams = classDecl.getTypeParameters().map(tp => tp.getText())

    types.push({
      name,
      jsdoc,
      definition: classDecl.getText(),
      kind: 'class',
      isDefault: classDecl.isDefaultExport(),
      typeParameters: typeParams.length > 0 ? typeParams : undefined,
    })
  }

  return types
}

/**
 * Extracts re-export statements from a source file
 */
export function extractReExports(sourceFile: SourceFile): readonly ReExport[] {
  const reExports: ReExport[] = []

  for (const exportDecl of sourceFile.getExportDeclarations()) {
    const moduleSpecifier = exportDecl.getModuleSpecifierValue()
    if (moduleSpecifier === undefined || moduleSpecifier.length === 0) continue

    if (exportDecl.isNamespaceExport()) {
      const namespaceExport = exportDecl.getNamespaceExport()
      reExports.push({
        from: moduleSpecifier,
        exports: '*',
        alias: namespaceExport?.getName(),
      })
    } else {
      const namedExports = exportDecl.getNamedExports().map(ne => {
        const aliasNode = ne.getAliasNode()
        const alias = aliasNode === undefined ? undefined : aliasNode.getText()
        const name = ne.getName()
        return alias === undefined ? name : `${name} as ${alias}`
      })

      if (namedExports.length > 0) {
        reExports.push({
          from: moduleSpecifier,
          exports: namedExports,
        })
      }
    }
  }

  return reExports
}

/**
 * Extracts the complete API surface from a source file
 */
export function extractPackageAPI(sourceFile: SourceFile): PackageAPI {
  return {
    functions: extractExportedFunctions(sourceFile),
    types: extractExportedTypes(sourceFile),
    reExports: extractReExports(sourceFile),
  }
}

/**
 * Parses and analyzes a TypeScript file, returning the complete API
 */
export function analyzeTypeScriptFile(
  filePath: string,
  options?: TypeScriptParserOptions,
): ParseResult<PackageAPI> {
  const project = createProject(options)
  const sourceFileResult = parseSourceFile(project, filePath)

  if (!sourceFileResult.success) {
    return sourceFileResult
  }

  try {
    const api = extractPackageAPI(sourceFileResult.data)
    return ok(api)
  } catch (error) {
    return err({
      code: 'INVALID_SYNTAX',
      message: `Failed to analyze TypeScript file: ${filePath}`,
      filePath,
      cause: error,
    } satisfies ParseError)
  }
}

/**
 * Analyzes TypeScript content from a string
 */
export function analyzeTypeScriptContent(
  content: string,
  options?: TypeScriptParserOptions,
): ParseResult<PackageAPI> {
  const project = createProject(options)
  const sourceFileResult = parseSourceContent(project, content)

  if (!sourceFileResult.success) {
    return sourceFileResult
  }

  try {
    const api = extractPackageAPI(sourceFileResult.data)
    return ok(api)
  } catch (error) {
    return err({
      code: 'INVALID_SYNTAX',
      message: 'Failed to analyze TypeScript content',
      cause: error,
    } satisfies ParseError)
  }
}
