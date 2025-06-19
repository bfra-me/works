---
description: FOLLOW when WRITING tests to ENSURE comprehensive coverage
applyTo: '**/*.test.ts,**/*.test.tsx,**/*.spec.ts,**/*.spec.tsx,**/vitest.config.*,**/test/**/*.ts,**/test/**/*.tsx'
---
# Testing Practices (Vitest & Monorepo)

Best practices for writing, organizing, and maintaining tests in the bfra.me/works monorepo using Vitest

## Testing Best Practices for bfra.me/works

This monorepo uses [**Vitest**](https://vitest.dev/) for all testing. Follow these guidelines for effective, maintainable, and high-quality tests:

### 1. Test Organization
- Place all tests in a `test/` directory at the package root or alongside source files as `*.test.ts`/`*.spec.ts`
- Use descriptive file names: `feature-name.test.ts`
- Group related tests with `describe()` blocks
- Prefer `it()` over `test()` for test cases (per user preference)
- Keep test files focused: one feature/module per file

### 2. Vitest Setup
- Use a `vitest.config.ts` file extending the shared config if needed
- Example:
  ```typescript
  // vitest.config.ts
  import {defineConfig} from 'vitest/config'
  export default defineConfig({
    test: {
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'json'],
        exclude: ['**/node_modules/**', '**/dist/**', '**/*.d.ts']
      },
      environment: 'node',
      include: ['test/**/*.test.ts'],
      cache: true,
      watch: false
    }
  })
  ```

- Add a `test` script to `package.json`:
  ```json
  {
    "scripts": {
      "test": "vitest run"
    }
  }
  ```

### 3. Test Patterns
- Use fixtures and snapshots for config and output validation
- Use type testing features for TypeScript APIs
- Prefer functional test helpers over class-based test utilities
- Use extended expect matchers for clarity
- Use `beforeEach`/`afterEach` for setup/teardown
- Mock dependencies with `vi.mock()`
- Use `vi.fn()` for spies and stubs
- Avoid global state between tests
- Use coverage reports (`pnpm test --coverage`)
- Use test caching for local and CI runs

### 4. TDD & Test Quality
- Write tests before or alongside implementation (TDD encouraged)
- Cover edge cases and error conditions
- Use clear, descriptive test names
- Keep tests deterministic and isolated
- Avoid testing implementation details; focus on public API/behavior
- Use snapshots judiciously (update only with intent)

### 5. Example Test File
```typescript
// test/math-utils.test.ts
import {describe, expect, it} from 'vitest'
import {add} from '../src/math-utils'

describe('add', () => {
  it('adds two numbers', () => {
    expect(add(2, 3)).toBe(5)
  })

  it('handles negative numbers', () => {
    expect(add(-2, 3)).toBe(1)
  })
})
```

### 6. Coverage & CI
- Always check coverage locally before PRs: `pnpm test --coverage`
- Coverage thresholds can be set in `vitest.config.ts`
- CI will fail if tests or coverage do not pass

### 7. Troubleshooting
- Use `pnpm test --watch` for local development
- Use `vi.clearAllMocks()` in `afterEach` if needed
- For flaky tests, investigate async handling and state leaks
- Use `--run` for headless CI runs

## Frequently Asked Questions (FAQs)

These FAQs cover common questions about testing practices in the bfra.me/works monorepo using Vitest. They provide quick answers and examples for typical scenarios.

### How should I organize my tests for a new package?

- Place all tests in a `test/` directory at the package root or as `*.test.ts` files next to the code
- Use descriptive file names (e.g., `math-utils.test.ts`)
- Group related tests with `describe()`
- Prefer `it()` over `test()`
- Keep each test file focused on a single feature or module

### How do I set up Vitest for a new package?

1. Add `vitest` to your `devDependencies`:
    ```bash
    pnpm add -D vitest
    ```
2. Create a `vitest.config.ts` file:
    ```typescript
    import {defineConfig} from 'vitest/config'
    export default defineConfig({
      test: {
        coverage: {provider: 'v8', reporter: ['text', 'html', 'json']},
        environment: 'node',
        include: ['test/**/*.test.ts']
      }
    })
    ```
3. Add a `test` script to your `package.json`:
    ```json
    {
      "scripts": {
        "test": "vitest run"
      }
    }
    ```
4. Run tests with `pnpm test`

### How do I mock a dependency in Vitest?

Use `vi.mock()` to mock modules and `vi.fn()` for spies/stubs:
```typescript
import {vi} from 'vitest'
vi.mock('../src/my-module', () => ({
  myFunction: vi.fn()
}))
```

### How do I generate a coverage report?

Run `pnpm test --coverage` to generate a coverage report. Configure coverage options in `vitest.config.ts`.

### Should I use `test` or `it` in Vitest?

Prefer `it()` over `test()` for test cases, as per user preferences.
