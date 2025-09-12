# @bfra.me/badge-config

> A TypeScript API for generating shields.io badge URLs with presets for common use cases.

## Installation

```bash
pnpm add @bfra.me/badge-config
```

## Usage

### Basic Usage

Create a simple badge by providing a label, message, and color.

```typescript
import { createBadge } from '@bfra.me/badge-config';

const badgeUrl = createBadge({
  label: 'build',
  message: 'passing',
  color: 'green',
});

console.log(badgeUrl);
// => https://img.shields.io/badge/build-passing-green
```

### Using Presets

The package includes preset generators for common badges like build status, coverage, version, and license.

#### Build Status

```typescript
import { buildStatus } from '@bfra.me/badge-config/generators';

const successBadge = buildStatus('success');
// => https://img.shields.io/badge/build-success-green

const failureBadge = buildStatus('failure');
// => https://img.shields.io/badge/build-failure-red
```

#### Coverage

The coverage preset automatically adjusts the color based on the percentage.

```typescript
import { coverage } from '@bfra.me/badge-config/generators';

const highCoverage = coverage(95);
// => https://img.shields.io/badge/coverage-95%25-green

const lowCoverage = coverage(45);
// => https://img.shields.io/badge/coverage-45%25-red
```

## API

### `createBadge(options)`

Generates a shields.io badge URL.

- `options` (`BadgeOptions`): Configuration object.
  - `label` (`string`): The text on the left side of the badge.
  - `message` (`string`): The text on the right side of the badge.
  - `color` (`string`): The color of the right side of the badge.
  - `style` (`'plastic' | 'flat' | 'flat-square' | 'for-the-badge' | 'social'`): The badge style.
  - `logo` (`string`): A named logo from [simple-icons](https://simpleicons.org/).
  - `logoColor` (`string`): The color of the logo.

### Preset Generators

#### `buildStatus(status)`

- `status` (`'success' | 'failure' | 'pending' | 'running'`): The build status.

#### `coverage(percentage)`

- `percentage` (`number`): The code coverage percentage (0-100).

#### `version(versionString)`

- `versionString` (`string`): A semantic version string.

#### `license(licenseType)`

- `licenseType` (`'MIT' | 'Apache-2.0' | 'GPL-3.0'`): The license type.

## CI/CD Integration

You can use `@bfra.me/badge-config` in your CI/CD pipeline to generate dynamic badges.

### GitHub Actions Example

```yaml
# .github/workflows/ci.yml
name: CI

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - name: Install dependencies
        run: pnpm install
      - name: Generate Badges
        id: generate_badges
        run: |
          # Example script to generate badges
          # You would replace this with your own script using @bfra.me/badge-config
          echo "::set-output name=build_badge::https://img.shields.io/badge/build-passing-green"
      - name: Update README
        run: |
          # Example of updating README with the new badge
          # This is a simplified example. A more robust solution would use a templating engine.
          sed -i "s|!\[Build Status\].*|![Build Status](${{ steps.generate_badges.outputs.build_badge }})|" README.md

```

## Performance

URL generation is synchronous and very fast. For applications requiring thousands of badges, consider caching the results to avoid redundant computations.

---

_This README was generated with the help of GitHub Copilot._
