# Performance Optimization

Performance baseline and optimization tracking for the bfra.me/works monorepo.

## Targets

| Metric                     | Target       | Status       |
| -------------------------- | ------------ | ------------ |
| `pnpm validate` (local)    | < 2 minutes  | 🔄 Measuring |
| `pnpm build` (full)        | < 45 seconds | 🔄 Measuring |
| `pnpm build` (incremental) | < 5 seconds  | 🔄 Measuring |
| `pnpm test`                | < 30 seconds | 🔄 Measuring |
| `pnpm lint`                | < 20 seconds | 🔄 Measuring |
| `pnpm analyze`             | < 10 seconds | 🔄 Measuring |
| CI pipeline (total)        | < 5 minutes  | 🔄 Measuring |

## Optimizations Applied

### Cache Invalidation Strategy (December 2025)

**Problem**: Development cache key included `**/*.ts` which invalidated all caches on any TypeScript file change (tests, docs, fixtures).

**Solution**: Narrowed cache pattern to `packages/*/src/**/*.ts` and added dedicated ESLint cache with its own key pattern.

**Files Changed**:

- `.github/actions/pnpm-install/action.yaml`

**Expected Impact**: 50-70% improvement in cache hit rate

### Parallelized Validation Pipeline (December 2025)

**Problem**: `pnpm validate` ran all steps sequentially: type-check → build → lint → test → type-coverage

**Solution**: Run type-check, lint, and test concurrently (they have no dependencies due to vitest's `conditions: ['source']` resolver), then build and type-coverage sequentially.

**Before**:

```text
type-check → build → lint → test → type-coverage
[sequential, ~2-3 minutes]
```

**After**:

```text
┌─────────────┬─────────┬──────┐
│ type-check  │  lint   │ test │  (parallel)
└─────────────┴─────────┴──────┘
              ↓
           build
              ↓
        type-coverage
```

**Files Changed**:

- `package.json` (validate script)

**Expected Impact**: 30-40% reduction in validate time

### CI Job Reordering (December 2025)

**Problem**: `analyze` job waited for `build` to complete unnecessarily.

**Solution**: Changed `analyze` to depend on `prepare` instead of `build`. Workspace-analyzer scans source files, not build artifacts.

**Files Changed**:

- `.github/workflows/main.yaml`

**Expected Impact**: 10-15% reduction in CI wall-clock time

## Developer Profiling Guide

### Build Performance

```bash
TIMING=1 pnpm build 2>&1 | grep -E 'packages|total|✓'
```

### Test Performance

```bash
pnpm test -- --reporter=verbose
```

### Lint Performance

```bash
time pnpm lint
```

### Analyze Performance

```bash
time pnpm analyze
```

### Full Validation Timing

```bash
time pnpm validate
```

### Type-Check with Diagnostics

```bash
pnpm tsc --noEmit --diagnostics
```

## Cache Behavior

### pnpm Store Cache

- **Location**: pnpm store path
- **Rotation**: Monthly (year-month based key)
- **Invalidates on**: `pnpm-lock.yaml` changes

### Development Cache

- **Location**: `.tsup/`, `tsconfig.tsbuildinfo`, `.type-coverage/`, `docs/.astro/`
- **Invalidates on**: Source code changes (`packages/*/src/**/*.ts`)
- **Safe to delete**: Yes, triggers full rebuild

### ESLint Cache

- **Location**: `.eslintcache`
- **Invalidates on**: ESLint config or source changes
- **Safe to delete**: Yes, next lint run recreates it

## Troubleshooting

### Slow Builds

1. Check if ESLint cache exists: `ls -la .eslintcache`
2. Check tsup cache: `ls -la packages/*/.tsup`
3. Clean and rebuild: `pnpm clean && pnpm build`

### Cache Issues in CI

1. Check cache hit/miss in GitHub Actions logs
2. Verify cache key patterns match expected files
3. Force cache refresh by incrementing version in cache key

### Test Performance Degradation

1. Profile with: `pnpm test -- --reporter=verbose`
2. Check for large fixture files or slow setup
3. Ensure `it.concurrent()` used for independent tests

## Future Improvements

- [ ] Implement task-level build caching (Turbo or manual)
- [ ] Add test sharding across multiple CI runners
- [ ] Incremental workspace-analyzer with change detection
- [ ] Optimize eslint-config type generation caching
