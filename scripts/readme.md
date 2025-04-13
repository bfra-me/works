# @bfra.me/scripts

> Internal utility scripts for bfra.me monorepo.

## Available Scripts

### clean-changesets

A utility script to clean private package entries from changeset files. This is particularly useful when working with Renovate and private packages that should not be included in versioning.

#### Usage

```sh
# Using tsx directly
pnpm tsx scripts/src/clean-changesets.ts

# Or through the package export
pnpm tsx -e "import '@bfra.me/scripts/clean-changesets'"
```

#### Configuration

The script can be configured using environment variables:

- `PRIVATE_PACKAGES`: Comma-separated list of private package names to remove from changesets (default: `@api/test-utils`)
- `DRY_RUN`: Set to `true` to preview changes without applying them (default: `false`)

#### Examples

```sh
# Remove entries for multiple private packages
PRIVATE_PACKAGES="@api/test-utils,@api/other-private" pnpm tsx scripts/src/clean-changesets.ts

# Preview changes without applying them
DRY_RUN=true pnpm tsx scripts/src/clean-changesets.ts
```

## Development

### Install

```sh
pnpm install
```

### Test

```sh
pnpm test
```

### Lint

```sh
pnpm lint
```

## License

[MIT](../license.md)
