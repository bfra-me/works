---
description: 'FOLLOW when VERSIONING packages to ENSURE proper changelogs and releases'
applyTo: '.changeset/*.*,**/package.json'
---

# Changeset Workflow

Step-by-step guide for using Changesets to manage versioning and releases

## Changeset Workflow Guide

This monorepo uses [Changesets](https://github.com/changesets/changesets) to manage versioning, changelogs, and the release process.

### Understanding Changesets

A changeset is a small markdown file that:

- Describes changes made in a PR
- Specifies which packages are affected
- Indicates the semver impact (major, minor, patch)
- Lives in the `.changeset` directory

### Creating a Changeset

When making changes that should be published:

```bash
pnpm changeset
```

This interactive command will:

1. Ask which packages have changed
2. Ask about the impact (major, minor, patch) for each
3. Request a description of the changes
4. Create a markdown file in the `.changeset` directory

### Changeset File Format

Changeset files follow this format:

```markdown
---
"@bfra.me/package-name": minor
"@bfra.me/another-package": patch
---

Description of the changes made.
```

### Cleaning Private Packages

The monorepo includes a utility to remove private packages from changesets:

```bash
pnpm clean-changesets
```

This is useful when:

- Working with Renovate dependency updates
- Private packages are referenced in changesets
- You need to prepare for publishing

### Release Process

The release process has several parts:

#### 1. Version Packages (Local Development)

```bash
pnpm version-changesets
```

This command:

- Reads all changesets
- Updates package versions based on semver impact
- Updates CHANGELOG.md files
- Removes processed changeset files

#### 2. Automated Release PR (CI)

The repository has an automated GitHub workflow that:

- Runs weekly (Sundays at 6 PM UTC)
- Creates or updates a "Version Packages" PR
- Sets the PR to auto-merge if checks pass

#### 3. Publishing (CI)

When the release PR merges to main:

- CI builds all packages
- Publishes updated packages to npm
- Creates GitHub releases with changelogs
- Cleans up changesets

### Best Practices

1. **One Changeset Per PR**: Create one changeset per pull request that involves publishable changes.
2. **Clear Descriptions**: Write clear, concise descriptions that will make sense in a changelog.
3. **Correct Semver**: Follow semantic versioning rules:
   - `major`: Breaking changes (see [API Design Standards](mdc:.cursor/rules/api-design-standards.mdc))
   - `minor`: New features, non-breaking changes
   - `patch`: Bug fixes, documentation updates
4. **Check Dependencies**: If Package A depends on Package B, and B has a breaking change, A might also need a major bump.
5. **Include in PR**: Always commit the generated changeset file within your PR.

### Examples

#### Adding a New Feature

```bash
pnpm changeset
# Select @bfra.me/your-package
# Choose "minor" for a new feature
# Describe: "Added support for XYZ configuration"
```

#### Fixing a Bug

```bash
pnpm changeset
# Select the affected package(s)
# Choose "patch" for a bug fix
# Describe: "Fixed issue with ABC handling in certain cases"
```

#### Breaking Change

```bash
pnpm changeset
# Select affected package(s)
# Choose "major" for breaking changes
# Describe: "Removed deprecated XYZ API, use ABC instead"
```

## Example User Interaction

**User**: I've made changes to multiple packages and need to release them

**Assistant**: To release changes across multiple packages:

1. First, create a changeset to document your changes:

```bash
pnpm changeset
```

2. When prompted:
   - Select all the packages you've modified using the space bar
   - For each package, specify the semver impact:
   - `major` for breaking changes
   - `minor` for new features
   - `patch` for bug fixes
   - Write a clear description of the changes

3. This will create a new markdown file in the `.changeset` directory with content like:

```md
---
"@bfra.me/package-one": minor
"@bfra.me/package-two": patch
---

Added new feature X to package-one and fixed bug Y in package-two.
```

4. Commit this changeset file along with your code changes:

```bash
git add .
git commit -m "feat: add feature X and fix bug Y"
git push
```

5. Create a pull request with your changes

6. When your PR is merged to main:
   - The weekly auto-release workflow will create a "Version Packages" PR
   - This PR will update versions and changelogs based on your changeset
   - When the Version Packages PR is merged, CI will:
   - Build the updated packages
   - Publish them to npm
   - Create GitHub releases

If you need to release immediately rather than waiting for the weekly cycle, a maintainer can manually trigger the auto-release workflow from the GitHub Actions tab.
