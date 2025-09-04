# Semantic Release Testing Infrastructure

This directory contains the fixture-based testing infrastructure for the `@bfra.me/semantic-release` package. The testing infrastructure is designed to comprehensively test all aspects of the semantic-release ecosystem integration.

## Directory Structure

```
test/
├── fixtures/
│   ├── input/           # Test input data
│   │   ├── configurations/    # Basic configuration test cases
│   │   ├── plugins/          # Plugin configuration scenarios
│   │   ├── presets/          # Preset configuration tests
│   │   ├── validation/       # Validation test cases
│   │   └── typescript/       # TypeScript compilation tests
│   ├── output/          # Expected results
│   │   ├── configurations/   # Expected configuration results
│   │   ├── plugins/          # Expected plugin outputs
│   │   ├── presets/          # Expected preset results
│   │   ├── validation/       # Expected validation results
│   │   └── typescript/       # Expected TypeScript compilation results
│   └── temp/            # Temporary test files (auto-cleaned)
├── test-utils.ts        # Testing utilities and helpers
├── vitest.config.ts     # Vitest configuration
└── [test files]         # Individual test suites
```

## Test Categories

### 1. Configuration Tests (`configurations/`)
Tests for basic semantic-release configuration scenarios:
- **basic-configs.json**: Simple configuration examples
- **validated-configs.json**: Expected validation results

**Coverage:**
- Basic configuration validation
- Complex multi-branch setups
- Monorepo configurations
- Minimal configurations

### 2. Plugin Tests (`plugins/`)
Tests for individual plugin configurations:
- **plugin-configs.json**: Plugin-specific configuration options
- All major semantic-release plugins covered

**Plugins Tested:**
- `@semantic-release/commit-analyzer`
- `@semantic-release/release-notes-generator`
- `@semantic-release/changelog`
- `@semantic-release/npm`
- `@semantic-release/github`
- `@semantic-release/git`

### 3. Preset Tests (`presets/`)
Tests for shareable configuration presets:
- **preset-configs.json**: Preset input configurations
- **preset-results.json**: Expected preset outputs

**Presets Covered:**
- NPM package preset
- GitHub release preset
- Monorepo preset
- Custom presets

### 4. Validation Tests (`validation/`)
Tests for configuration validation and error handling:
- **validation-cases.json**: Valid and invalid configuration examples
- **validation-results.json**: Expected validation outcomes

**Validation Scenarios:**
- Valid configurations
- Invalid configurations with specific error messages
- Edge cases (null, undefined, wrong types)
- Plugin validation

### 5. TypeScript Tests (`typescript/`)
Tests for TypeScript integration and type safety:
- **usage-examples.json**: TypeScript usage examples
- **compilation-results.json**: Expected compilation results

**TypeScript Features:**
- Basic usage with `defineConfig`
- Preset usage patterns
- Configuration composition
- Builder pattern usage
- Factory function usage
- Complex type scenarios

## Test Utilities

The `test-utils.ts` file provides a comprehensive set of utilities for fixture-based testing:

### Core Functions

```typescript
// Load fixtures
testUtils.loadJsonFixture<T>('input', 'category', 'file.json')
testUtils.loadTextFixture('input', 'category', 'file.txt')

// Save test outputs
testUtils.saveFixture(data, 'output', 'category', 'file.json')

// Compare results with fixtures
testUtils.compareWithFixture(actual, 'category', 'expected.json')

// Manage fixture directories
testUtils.ensureFixtureDirectories()
testUtils.cleanup()
```

### Specialized Functions

```typescript
// Load all configurations from a category
testUtils.loadConfigurationFixtures('presets')

// Create mock semantic-release context
testUtils.createMockContext(overrides)

// Validate semantic-release configurations
testUtils.isValidSemanticReleaseConfig(config)

// Deep partial matching for flexible comparisons
testUtils.deepPartialMatch(actual, expected)
```

## Usage Patterns

### 1. Basic Fixture Test

```typescript
import {describe, expect, it} from 'vitest'
import {testUtils} from './test-utils'

describe('configuration validation', () => {
  it('validates basic configurations', () => {
    const configs = testUtils.loadJsonFixture('input', 'configurations', 'basic-configs.json')
    const expected = testUtils.loadJsonFixture('output', 'configurations', 'validated-configs.json')

    // Test logic here
    const result = testUtils.compareWithFixture(actual, 'configurations', 'validated-configs.json')
    expect(result.matches).toBe(true)
  })
})
```

### 2. Bulk Configuration Testing

```typescript
describe('preset configurations', () => {
  it('validates all preset configurations', () => {
    const presetConfigs = testUtils.loadConfigurationFixtures('presets')

    for (const [name, config] of Object.entries(presetConfigs)) {
      const result = validatePresetConfig(config)
      expect(result.valid).toBe(true)
    }
  })
})
```

### 3. TypeScript Compilation Testing

```typescript
describe('typescript integration', () => {
  it('compiles usage examples', () => {
    const examples = testUtils.loadJsonFixture('input', 'typescript', 'usage-examples.json')
    const expected = testUtils.loadJsonFixture('output', 'typescript', 'compilation-results.json')

    for (const [name, code] of Object.entries(examples)) {
      const compileResult = compileTypeScriptCode(code)
      expect(compileResult.success).toBe(expected[name].compiles)
    }
  })
})
```

## Adding New Test Cases

### 1. Add Input Fixture
Create a new JSON file in the appropriate `input/` subdirectory:

```json
{
  "test-case-name": {
    "config": { /* test configuration */ },
    "options": { /* test options */ }
  }
}
```

### 2. Add Expected Output
Create corresponding expected output in `output/` subdirectory:

```json
{
  "test-case-name": {
    "result": { /* expected result */ },
    "valid": true,
    "errors": []
  }
}
```

### 3. Write Test
Use the test utilities to load fixtures and compare results:

```typescript
it('tests new scenario', () => {
  const input = testUtils.loadJsonFixture('input', 'category', 'new-test.json')
  const result = processInput(input)

  const comparison = testUtils.compareWithFixture(result, 'category', 'expected-output.json')
  expect(comparison.matches).toBe(true)
})
```

## Best Practices

1. **Organize by Feature**: Group related test cases in appropriate categories
2. **Use Descriptive Names**: Make fixture file names clear and specific
3. **Include Edge Cases**: Test boundary conditions and error scenarios
4. **Document Expectations**: Include comments in fixture files explaining test purpose
5. **Clean Up**: Use `testUtils.cleanup()` in test teardown
6. **Validate Schema**: Ensure fixture data matches expected types
7. **Update Output**: Regenerate expected outputs when implementation changes

## Quality Gates

The fixture-based testing infrastructure supports comprehensive quality validation:

- **Configuration Validation**: All configurations must pass Zod schema validation
- **TypeScript Compilation**: Usage examples must compile without errors
- **Plugin Integration**: Plugin configurations must be semantically valid
- **Preset Composition**: Preset merging and customization must work correctly
- **Error Handling**: Error scenarios must produce expected error messages

This infrastructure ensures that the `@bfra.me/semantic-release` package maintains high quality and reliability across all supported use cases.
