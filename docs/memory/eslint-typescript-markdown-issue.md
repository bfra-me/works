# ESLint Configuration for TypeScript in Markdown

## Overview
- **Task ID**: 2025-04-26-01
- **Type**: Bug Fix
- **Status**: Completed
- **Completion Date**: 2025-04-26
- **Components Affected**: ESLint configuration, TypeScript integration, Markdown processing

## Problem Description
When attempting to use TypeScript ESLint's type-aware linting features with Markdown files containing TypeScript code blocks, parsing errors occurred. The errors were related to the `@typescript-eslint/parser` not being able to perform type-aware linting on code fragments within Markdown files.

### Error Messages Encountered

The following errors were encountered:

1. Parsing error from the `@typescript-eslint/parser` when type-aware linting was enabled for Markdown code blocks:
   ```
   Parsing error: "parserOptions.project" has been set for @typescript-eslint/parser. The file does not match your project config: README.md/0_0.ts. The file must be included in at least one of the projects provided
   ```

2. The parser was unable to locate these virtual files (like `README.md/0_0.ts`) as they don't physically exist on disk and aren't included in any tsconfig.json.

### Root Cause Analysis

The issue stems from a fundamental limitation in how type-aware linting works in TypeScript:

1. Type-aware linting requires a TypeScript Program object that has parsed and analyzed entire projects.
2. The `eslint-plugin-markdown` processor creates virtual files for each code block within Markdown files.
3. These virtual files (like `README.md/0_0.ts`) don't exist on disk and aren't included in any tsconfig.json.
4. When the TypeScript parser tries to perform type-aware linting on these virtual files, it fails because they're not part of the TypeScript program.

## Solution Implemented

The solution was to disable type-aware rules specifically for Markdown files in the ESLint configuration:

```typescript
{
  files: ["*.md"],
  // or more specifically for the virtual files extracted from Markdown
  // files: ["*.md/*.ts", "*.md/*.tsx", "*.md/*.js", "*.md/*.jsx"],
  rules: {
    // Disable all type-aware rules for Markdown files
    "@typescript-eslint/dot-notation": "off",
    "@typescript-eslint/no-implied-eval": "off",
    "@typescript-eslint/no-throw-literal": "off",
    // ...and any other type-aware rules you're using
  }
}
```

This approach allows the code to still be linted with non-type-aware rules, while avoiding errors from rules that require type information.

## Implementation Details

- Configuration changes were made to the ESLint setup to specifically target and handle Markdown files differently from regular TypeScript files.
- This solution provides a pragmatic balance between having linting for documentation code examples while avoiding errors from type-aware rules.
- The changes were implemented in the eslint-config package's TypeScript configuration.

## Caveats and Limitations

1. **Loss of Type Safety in Examples**: By disabling type-aware rules in Markdown, we lose some of the benefits of static analysis in documentation examples.

2. **Maintenance Overhead**: As new type-aware rules are added to your configuration, you'll need to remember to disable them for Markdown files.

3. **Alternative Approaches**:
   - Consider using automated testing for code examples in documentation to verify their correctness instead of relying solely on ESLint.
   - For critical code examples, consider maintaining them in actual TypeScript files that are included in your tsconfig.json and imported/referenced in documentation.

4. **Future Developments**: The TypeScript ESLint team is aware of this limitation, but there's no direct solution due to the fundamental architecture of TypeScript's type checking system, which requires files to be part of a Program.

## Related Tasks
- ESLint Configuration Improvement (Task ID: 2025-04-20-03)
- TypeScript Integration Update (Task ID: 2025-04-15-02)

## References
- [ESLint Plugin Markdown Documentation](https://github.com/eslint/eslint-plugin-markdown)
- [TypeScript ESLint Parser Documentation](https://typescript-eslint.io/architecture/parser/)
- [Technical Decision on ESLint Configuration](/docs/memory/decisions.md)
- [Domain Knowledge on TypeScript Integration](/docs/memory/domain-knowledge.md)

## Updated: 2025-04-26
