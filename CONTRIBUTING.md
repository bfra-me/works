# Contributing to bfra.me Works

We welcome contributions to bfra.me Works! This guide will help you get started with contributing to the project.

## Getting Started

Before starting work:

- **Code of Conduct** — We expect all contributors to follow our code of conduct and maintain a respectful environment.
- **Issue First** — Please create or comment on an issue to discuss your contribution before starting work.
- **Quality Standards** — All contributions must meet our quality standards including tests, documentation, and code style.

## Development Setup

1. **Fork and clone the repository**

   ```bash
   git clone https://github.com/YOUR_USERNAME/works.git
   cd works
   ```

2. **Install dependencies**

   This project requires Node.js 20+ and pnpm.

   ```bash
   pnpm bootstrap
   ```

3. **Build all packages**

   ```bash
   pnpm build
   ```

4. **Run tests**

   ```bash
   pnpm test
   ```

5. **Verify the setup**

   ```bash
   pnpm validate
   ```

## Project Structure

```text
works/
├── packages/              # Individual packages
│   ├── badge-config/     # @bfra.me/badge-config
│   ├── create/           # @bfra.me/create
│   ├── es/               # @bfra.me/es
│   ├── eslint-config/    # @bfra.me/eslint-config
│   ├── prettier-config/  # @bfra.me/prettier-config
│   ├── semantic-release/ # @bfra.me/semantic-release
│   ├── tsconfig/         # @bfra.me/tsconfig
│   └── workspace-analyzer/ # @bfra.me/workspace-analyzer
├── docs/                 # Documentation site
├── scripts/              # Build and utility scripts
├── .changeset/           # Changeset configuration
├── pnpm-workspace.yaml   # pnpm workspace configuration
└── package.json          # Root package.json
```

## Development Workflow

### Making Changes

1. **Create a feature branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**

   Edit the relevant files in the appropriate package directories.

3. **Add tests**

   Ensure your changes are covered by tests:

   ```bash
   # Run tests for a specific package
   pnpm --filter @bfra.me/eslint-config test

   # Run all tests
   pnpm test
   ```

4. **Update documentation**

   Update relevant documentation in:
   - Package README files
   - Documentation site in `docs/`
   - Code comments

5. **Validate your changes**

   ```bash
   # Lint and format code
   pnpm lint
   pnpm fix

   # Type check
   pnpm type-check

   # Run full validation
   pnpm validate
   ```

### Creating a Changeset

We use changesets to manage version bumps and changelog generation:

1. **Create a changeset**

   ```bash
   pnpm changeset
   ```

2. **Select affected packages**

   Choose which packages are affected by your changes.

3. **Choose version bump type**
   - **Major**: Breaking changes
   - **Minor**: New features
   - **Patch**: Bug fixes

4. **Write a description**

   Provide a clear description of your changes.

## Testing Guidelines

### Unit Tests

Write comprehensive unit tests for all functionality using Vitest:

```typescript
import {describe, expect, it} from 'vitest'
import {myFunction} from '../src/index'

describe('myFunction', () => {
  it('should handle valid input', () => {
    const result = myFunction('test')
    expect(result).toBe('expected output')
  })

  it('should handle edge cases', () => {
    expect(() => myFunction('')).toThrow('Invalid input')
  })
})
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests for a specific package
pnpm --filter @bfra.me/es test

# Run tests in watch mode
pnpm vitest
```

## Code Style

### TypeScript

- Use strict TypeScript settings
- Avoid `any` types; prefer proper type definitions
- Use proper JSDoc comments for public APIs
- Follow consistent naming conventions

```typescript
// Good
interface CreateOptions {
  template: string
  author?: string
}

// Avoid
interface options {
  template: any
  author: any
}
```

### Formatting

All code is formatted with Prettier. Formatting is applied automatically on commit via lint-staged:

```bash
pnpm fix
```

### Linting

Code is linted with ESLint using `@bfra.me/eslint-config`:

```bash
pnpm lint
```

## Commit Guidelines

Use conventional commits:

```bash
# Features
git commit -m "feat(create): add new template system"

# Bug fixes
git commit -m "fix(eslint-config): resolve typescript rule conflict"

# Documentation
git commit -m "docs(readme): update installation instructions"

# Breaking changes
git commit -m "feat(tsconfig): update to strict mode

BREAKING CHANGE: strict mode is now enabled by default"
```

## Pull Request Process

1. **Create a descriptive PR title**

   Use conventional commit format: `feat(package): description`

2. **Fill out the PR template**
   - Describe your changes
   - Link to relevant issues
   - Add testing instructions

3. **Ensure all checks pass**
   - Tests pass
   - Code is formatted
   - Type checking passes
   - Documentation is updated

4. **Request review**

   Tag relevant maintainers for review.

5. **Address feedback**

   Make requested changes and update the PR.

## Issue Guidelines

### Bug Reports

Include:

- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (Node.js version, OS, etc.)
- Code examples

### Feature Requests

Include:

- Use case description
- Proposed solution
- Alternative solutions considered
- Breaking change analysis

## Release Process

Releases are automated using Changesets and GitHub Actions:

1. **Merge to main**: Changes are merged to the main branch
2. **Changeset PR**: A PR is created with version bumps
3. **Merge changeset PR**: Triggers automated release
4. **Publish**: Packages are published to npm

## Getting Help

If you need help contributing:

1. **Check the documentation**: Most questions are answered in the [docs](docs/)
2. **Search existing issues**: Someone might have asked the same question
3. **Create a discussion**: For general questions about contributing
4. **Create an issue**: For specific bugs or feature requests

## Recognition

Contributors are recognized in:

- **CHANGELOG.md**: All changes are credited
- **Git history**: All commits are preserved
- **Release notes**: Significant contributions are mentioned

Thank you for contributing to bfra.me Works! 🎉
