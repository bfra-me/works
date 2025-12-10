# Contributing to Documentation

Thank you for your interest in improving the bfra.me Works documentation! This guide provides guidelines for contributing to the documentation site.

## Documentation Structure

The documentation site is built with [Astro Starlight](https://starlight.astro.build/) and organized as follows:

```text
docs/
├── src/
│   └── content/
│       └── docs/
│           ├── getting-started/     # Getting started guides
│           ├── guides/              # How-to guides
│           ├── packages/            # Package documentation
│           └── reference/           # Reference documentation
├── scripts/                         # Automation scripts
│   └── sync-versions.ts            # Syncs package versions to MDX files
├── test/                           # Documentation tests
│   ├── content-validation.test.ts  # MDX syntax and frontmatter validation
│   ├── link-validation.test.ts     # Internal link checking
│   └── version-sync.test.ts        # Version badge synchronization
├── astro.config.mjs                # Astro configuration
└── package.json                    # Scripts and dependencies
```

## Adding New Package Documentation

Package documentation is automatically synchronized from package READMEs using `@bfra.me/doc-sync`. **Do not manually create or edit package documentation files.**

### Automated Workflow

When you update a package's `README.md`, run:

```bash
pnpm prepare
```

This executes `@bfra.me/doc-sync` to automatically:

1. Extract content from `packages/[name]/README.md`
2. Transform it to Astro Starlight-compatible MDX
3. Update `docs/src/content/docs/packages/[name].mdx`
4. Synchronize version badges from `package.json`

### Manual Steps Required

For new packages, you must manually:

1. **Update the sidebar** in `astro.config.mjs`:

   ```javascript
   // In the sidebar array, add:
   const sidebarItem = {
     label: 'Packages',
     items: [
       // existing packages
       {label: 'package-name', slug: 'packages/package-name'},
     ],
   }
   ```

2. **Run quality checks** to verify:

Before committing, run the quality validation:

```bash
pnpm --filter docs validate
```

This will:

- Type-check the Astro site
- Lint MDX files
- Run content validation tests
- Build the documentation site

## Documentation Standards

### Frontmatter Requirements

All documentation files MUST include these frontmatter fields:

```mdx
---
title: Page Title
description: Brief description (used for SEO and summaries)
---
```

### Code Examples

- Use appropriate language tags for syntax highlighting (`typescript`, `javascript`, `bash`, etc.)
- Ensure code examples are syntactically valid
- Test examples when possible
- Include inline comments for complex examples

### MDX Components

Use Starlight components to enhance documentation:

- **`<Badge>`**: Version badges, status indicators
- **`<Card>` / `<CardGrid>`**: Feature highlights, related links
- **`<Tabs>` / `<TabItem>`**: Multiple code examples or alternatives
- **`<Steps>`**: Sequential instructions

### Links

- Use relative paths for internal links: `[link text](/path/to/page/)`
- Ensure all internal links are valid (tested automatically)
- Use absolute URLs for external links

### Version Badges

Version badges are automatically synchronized from `package.json` files when running:

```bash
pnpm prepare
```

This runs both `@bfra.me/doc-sync` (README → MDX) and version badge synchronization.

## Development Workflow

### Local Development

Start the development server:

```bash
pnpm --filter docs dev
```

The site will be available at `http://localhost:4321/works/`

### Running Tests

Run content validation tests:

```bash
pnpm --filter docs test
```

Tests validate:

- MDX syntax correctness
- Required frontmatter fields
- Code block syntax
- Internal link validity
- Version badge synchronization

### Building

Build the documentation site:

```bash
pnpm --filter docs build
```

### Linting

Lint MDX and TypeScript files:

```bash
pnpm --filter docs lint
```

## Quality Standards

All documentation contributions must:

1. **Pass Type Checking**: `pnpm type-check`
2. **Pass Linting**: `pnpm lint`
3. **Pass Tests**: `pnpm test`
4. **Build Successfully**: `pnpm build`

Run all checks with:

```bash
pnpm --filter docs validate
```

## Common Tasks

### Updating Package Documentation

To update documentation after modifying a package README:

```bash
pnpm prepare
```

This synchronizes all package READMEs to the documentation site and updates version badges.

### Fixing Broken Links

If link validation tests fail:

1. Check the test output for broken links
2. Update the link in the source (package README or guide MDX file)
3. Run `pnpm prepare` to sync changes
4. Re-run tests to verify the fix

## Getting Help

- **Documentation Issues**: Create an issue with the `documentation` label
- **Questions**: Start a discussion in GitHub Discussions
- **Contributing Guide**: See the main [Contributing guide](src/content/docs/guides/contributing.mdx)

## Code of Conduct

All contributors are expected to follow the project's code of conduct:

- Be respectful and inclusive
- Provide constructive feedback
- Help maintain a positive environment
- Follow project guidelines

## Recognition

Contributors to the documentation are recognized in:

- Git commit history
- Pull request acknowledgments
- Release notes for significant improvements

Thank you for helping improve the bfra.me Works documentation! 📚
