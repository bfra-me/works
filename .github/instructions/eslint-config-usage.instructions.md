---
description: FOLLOW when SETTING UP ESLint to ENFORCE consistent code style
applyTo: '**/eslint.config.ts,**/*.config.ts'
---

# Using @bfra.me/eslint-config

The [`@bfra.me/eslint-config`](../../packages/eslint-config) package provides a comprehensive, modular, and highly configurable ESLint setup for JavaScript and TypeScript projects. It uses ESLint's Flat Config API and offers a wide range of presets.

## Installation

```bash
# npm
npm install --save-dev @bfra.me/eslint-config eslint

# pnpm
pnpm add -D @bfra.me/eslint-config eslint

# yarn
yarn add -D @bfra.me/eslint-config eslint
```

## Basic Configuration

Create an `eslint.config.ts` file in your project root:

### TypeScript Config (eslint.config.ts)

```typescript
import {defineConfig} from '@bfra.me/eslint-config'

export default defineConfig({
  // Project name (useful for debugging)
  name: 'my-project',

  // TypeScript configuration
  typescript: {
    tsconfigPath: './tsconfig.json',
    // Enable type-aware linting
    typeAware: true
  },

  // Enable JSX support
  jsx: true,

  // File types to lint
  jsonc: true,
  yaml: true,
  markdown: true,

  // Tool integrations
  prettier: true,
  vitest: true,
})
```

## Configuration Options

The `defineConfig` function accepts the following options:

```typescript
type Options = {
  // Core options
  name?: string;                    // Project name for debugging
  gitignore?: boolean;              // Use .gitignore for ignoring files (default: true)

  // Language options
  typescript?: boolean | {          // TypeScript support
    tsconfigPath?: string;          // Path to tsconfig.json
    typeAware?: boolean | {         // Type-aware linting settings
      recommended?: boolean;        // Use recommended type-aware rules
      strict?: boolean;             // Use strict type-aware rules
      stylistic?: boolean;          // Use stylistic type-aware rules
    };
  };
  jsx?: boolean;                    // JSX support

  // File type options
  jsonc?: boolean;                  // JSONC/JSON5 support
  yaml?: boolean;                   // YAML support
  toml?: boolean;                   // TOML support
  markdown?: boolean;               // Markdown support

  // Framework options
  vitest?: boolean;                 // Vitest test framework support

  // Tool integration
  prettier?: boolean;               // Prettier integration
  perfectionist?: boolean;          // Code organization rules

  // Custom rules
  overrides?: {                     // Override any rule configuration
    [ruleId: string]: 'off' | 'warn' | 'error' | [severity: 'off' | 'warn' | 'error', options: any];
  };
}
```

## Common Usage Patterns

### TypeScript Library

```typescript
import {defineConfig} from '@bfra.me/eslint-config'

export default defineConfig({
  name: 'ts-lib',
  typescript: {
    tsconfigPath: './tsconfig.json',
    typeAware: {
      strict: true
    }
  }
})
```

### React Application

```typescript
import {defineConfig} from '@bfra.me/eslint-config'

export default defineConfig({
  name: 'react-app',
  typescript: true,
  jsx: true,
  jsonc: true,
  prettier: true,
  vitest: true
})
```

### Full Configuration with Overrides

```typescript
import {defineConfig} from '@bfra.me/eslint-config'

export default defineConfig({
  name: 'advanced-project',
  typescript: {
    tsconfigPath: './tsconfig.json',
    typeAware: {
      recommended: true,
      strict: true,
      stylistic: true
    }
  },
  jsx: true,
  jsonc: true,
  yaml: true,
  markdown: true,
  vitest: true,
  prettier: true,
  perfectionist: true,
  overrides: {
    // Override specific rules
    'no-console': 'warn',
    'perfectionist/sort-objects': 'off',
    '@typescript-eslint/no-explicit-any': 'error'
  }
})
```

## Rule Sets Included

The configuration includes rule sets for:

- JavaScript best practices
- TypeScript-specific rules
- Import/export organization
- Node.js specifics
- JSX/React when enabled
- JSON/YAML/TOML when enabled
- Markdown when enabled
- Vitest testing when enabled
- Prettier integration when enabled
- Various code quality plugins

## Performance Tips

1. Use `typescript.typeAware: false` during development and enable type-aware linting only in CI
2. Consider using `.eslintignore` or the built-in `gitignore: true` option to exclude unnecessary files
3. When using VS Code, install the ESLint extension and enable only needed validators

## Common Issues

- **Type-aware linting is slow**: This is normal; consider disabling it during development
- **Conflicts with Prettier**: Ensure `prettier: true` is set to avoid rule conflicts
- **Missing peer dependencies**: Install required ESLint plugins as needed
- **Rules too strict**: Use the `overrides` option to adjust specific rules

## Frequently Asked Questions

### How do I configure ESLint using the @bfra.me/eslint-config package?

To configure ESLint using the @bfra.me/eslint-config package:

1. Install the package:

```bash
pnpm add -D @bfra.me/eslint-config eslint
```

2. Create an `eslint.config.js` file in your project root:

```javascript
import {defineConfig} from '@bfra.me/eslint-config'

export default defineConfig({
  // Enable TypeScript support if needed
  typescript: true,
  // Enable Prettier integration
  prettier: true,
  // Add other options as needed (jsx, jsonc, yaml, vitest, etc.)
})
```

Or for TypeScript configuration file (`eslint.config.ts`):

```typescript
import {defineConfig} from '@bfra.me/eslint-config'

export default defineConfig({
  typescript: {
    tsconfigPath: './tsconfig.json',
    typeAware: true // Enable type-aware rules
  },
  prettier: true,
})
```

Adjust the options inside `defineConfig` based on your project's needs (TypeScript, JSX, file types, framework support, etc.).

### How can I disable the 'no-console' rule using overrides?

To disable the `no-console` rule, use the `overrides` option in your `eslint.config.js`:

```javascript
import {defineConfig} from '@bfra.me/eslint-config'

export default defineConfig({
  name: 'my-project',
  typescript: true,
  prettier: true,
  // ... other options
  overrides: {
    'no-console': 'off' // Disable the rule entirely
    // You could also set it to 'warn'
  }
})
```

This will apply all the standard configurations from `@bfra.me/eslint-config` but specifically turn off the `no-console` rule for your project.
