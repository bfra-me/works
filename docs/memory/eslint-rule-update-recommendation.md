# Recommended Updates for `eslint-config-usage.mdc`

Based on our experience with the TypeScript ESLint parser issues in Markdown files, I recommend the following updates to the `eslint-config-usage.mdc` Cursor rule.

## Add a New Section on Type-Aware Linting in Markdown Files

The current `eslint-config-usage.mdc` file should be updated to include a section specifically about handling TypeScript code in Markdown files when type-aware linting is enabled. Here's a proposed addition:

```markdown
## Type-Aware Linting in Markdown Files

When using type-aware linting with TypeScript in a project that includes Markdown files with code examples, you may encounter parsing errors like:

```
Parsing error: "parserOptions.project" has been set for @typescript-eslint/parser. The file does not match your project config: README.md/0_0.ts.
```

This occurs because the virtual files created by the Markdown processor for code blocks aren't part of your TypeScript project and can't be type-checked.

### Solution: Disable Type-Aware Rules for Markdown Files

Add an override in your ESLint configuration to disable type-aware rules for Markdown files:

```javascript
// In your eslint.config.js or .eslintrc.js
export default defineConfig({
  // ... your existing configuration
  overrides: [
    // ... other overrides
    {
      // Target Markdown files or the virtual files created from them
      files: ["*.md", "*.md/*.ts", "*.md/*.tsx", "*.md/*.js", "*.md/*.jsx"],
      rules: {
        // Disable all type-aware rules
        "@typescript-eslint/await-thenable": "off",
        "@typescript-eslint/dot-notation": "off",
        "@typescript-eslint/no-floating-promises": "off",
        "@typescript-eslint/no-implied-eval": "off",
        "@typescript-eslint/no-throw-literal": "off",
        "@typescript-eslint/no-unnecessary-type-assertion": "off",
        "@typescript-eslint/no-unsafe-argument": "off",
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/no-unsafe-call": "off",
        "@typescript-eslint/no-unsafe-member-access": "off",
        "@typescript-eslint/no-unsafe-return": "off",
        "@typescript-eslint/require-await": "off",
        "@typescript-eslint/restrict-plus-operands": "off",
        "@typescript-eslint/restrict-template-expressions": "off",
        "@typescript-eslint/unbound-method": "off"
        // Add any other type-aware rules your project uses
      }
    }
  ]
});
```

### Alternative: Disable parser options project for Markdown

For flat config, you can also use the `disableTypeChecked` utility:

```javascript
import { tseslint } from 'typescript-eslint';

export default [
  // ... your existing configuration
  {
    files: ["**/*.md", "**/*.md/*.ts", "**/*.md/*.tsx"],
    ...tseslint.configs.disableTypeChecked,
  },
];
```

With legacy ESLint configuration:

```javascript
{
  files: ["**/*.md", "**/*.md/*.ts", "**/*.md/*.tsx"],
  parserOptions: {
    project: null // Disable type checking for these files
  }
}
```
```

## Update the "Common Issues" Section

We should also enhance the "Common Issues" section to explicitly mention the Markdown issue:

```markdown
## Common Issues

- **Type-aware linting is slow**: This is normal; consider disabling it during development
- **Conflicts with Prettier**: Ensure `prettier: true` is set to avoid rule conflicts
- **Missing peer dependencies**: Install required ESLint plugins as needed
- **Rules too strict**: Use the `overrides` option to adjust specific rules
- **Parsing errors in Markdown files**: When using type-aware linting, you'll need to disable type-aware rules for Markdown files (see the "Type-Aware Linting in Markdown Files" section)
```

## Add an Example for Markdown Configuration

In the "Examples" section, add a new example specifically for handling Markdown files:

```markdown
### Project with Documentation in Markdown

```javascript
import { defineConfig } from '@bfra.me/eslint-config'

export default defineConfig({
  name: 'docs-heavy-project',
  typescript: {
    tsconfigPath: './tsconfig.json',
    typeAware: true
  },
  jsx: true,
  markdown: true,
  prettier: true,
  overrides: {
    // Add other rule overrides as needed
  },
  // Additional configuration for handling Markdown files
  extends: [
    {
      files: ["**/*.md", "**/*.md/*.ts", "**/*.md/*.tsx"],
      rules: {
        // Disable type-aware rules for Markdown files
        "@typescript-eslint/await-thenable": "off",
        "@typescript-eslint/no-floating-promises": "off",
        // ... other type-aware rules
      }
    }
  ]
})
```
```

## Add to the Performance Tips

Add a new performance tip related to Markdown files:

```markdown
## Performance Tips

1. Use `typescript.typeAware: false` during development and enable type-aware linting only in CI
2. Consider using `.eslintignore` or the built-in `gitignore: true` option to exclude unnecessary files
3. When using VS Code, install the ESLint extension and enable only needed validators
4. Disable type-aware rules for Markdown files to avoid unnecessary processing of documentation code examples
```

These updates should provide clear guidance for users encountering the TypeScript in Markdown issue and offer practical solutions based on our experience.
