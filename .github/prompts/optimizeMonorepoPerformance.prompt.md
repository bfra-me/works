---
name: optimizeMonorepoPerformance
description: Identify and implement performance optimizations across the monorepo build, test, and analysis pipelines.
argument-hint: Specific area (e.g., "build times", "test execution", "workspace-analyzer speed") or "all"
---

# Optimize Monorepo Performance and Developer Experience

Systematically identify and implement performance improvements across build, test, and analysis workflows to reduce developer friction and CI/CD times.

## Performance Baseline Establishment

1. **Gather Current Metrics**:
   - Build time for full workspace: `pnpm build`
   - Test execution time: `pnpm test` (record total, individual packages)
   - Lint/type-check time: `pnpm lint` and `pnpm type-check`
   - Analysis time: `pnpm analyze`
   - Clean install and first build time
   - Size of node_modules and build artifacts

2. **Identify Bottlenecks**:
   - Profile build process with `TIMING=1 pnpm build`
   - Analyze test execution with `vitest --reporter=verbose`
   - Check TypeScript compilation with `tsc --diagnostics`
   - Profile workspace scanning with timing logs
   - Measure incremental vs clean build differences

3. **Developer Pain Points**:
   - Document slow workflows that developers encounter frequently
   - Identify context-switching delays (e.g., running validate vs individual steps)
   - Survey developer feedback on slow operations
   - Track CI failure rates and causes

## Optimization Opportunities

### Build Optimization

1. **Dependency Graph Optimization**:
   - Analyze build order and parallelization
   - Identify unnecessary dependencies between packages
   - Consider splitting large packages
   - Remove unused transitive dependencies

2. **Incremental Build Strategy**:
   - Configure tsup for better incremental builds
   - Implement file-based caching for build outputs
   - Create development build vs production build distinction
   - Use --watch mode effectively with hot reload

3. **TypeScript Configuration**:
   - Profile tsconfig.json compilation settings
   - Consider using `skipLibCheck` for faster checks
   - Evaluate `tsBuildInfoFile` for incremental compilation
   - Assess impact of `noUncheckedIndexedAccess` on compile time

### Test Optimization

1. **Test Execution Strategy**:
   - Run independent tests with `it.concurrent()`
   - Parallelize test execution across CPU cores
   - Configure vitest for optimal sharding
   - Consider test result caching for unchanged code

2. **Test File Organization**:
   - Group related tests in single files to reduce overhead
   - Separate unit tests from integration tests for faster CI feedback
   - Create fast smoke tests vs comprehensive test suites
   - Use fixtures efficiently to avoid file system overhead

3. **Coverage Analysis**:
   - Evaluate coverage threshold impact on test time
   - Selectively run coverage only on changed packages
   - Use coverage caching to avoid recomputation
   - Consider reducing coverage targets in development

### Workspace Analysis Optimization

1. **Scanning Strategy**:
   - Implement incremental analysis with cache validation
   - Use file hashing for change detection
   - Parallelize analysis across packages with proper concurrency limits
   - Skip unchanged packages in incremental runs

2. **AST Parsing Optimization**:
   - Cache parsed AST for unchanged files
   - Reuse TypeScript project instances
   - Batch file processing to reduce initialization overhead
   - Consider lazy loading of analysis rules

3. **Report Generation**:
   - Defer expensive computations until report generation
   - Stream output for large result sets
   - Implement progressive reporting with early results
   - Cache intermediate analysis results

### CI/CD Optimization

1. **Pipeline Structure**:
   - Run lint and type-check in parallel (not sequential)
   - Use early exit strategies for failures
   - Cache dependencies and build artifacts across runs
   - Implement selective testing based on changed files

2. **Caching Strategy**:
   - Cache pnpm dependencies with `pnpm-lock.yaml`
   - Cache build artifacts and dist directories
   - Cache test results for unchanged code
   - Implement workspace-analyzer cache in CI

3. **Artifact Management**:
   - Remove unnecessary artifacts before caching
   - Use efficient compression for large artifacts
   - Clean old cache entries periodically
   - Reduce build artifact size through tree-shaking

## Implementation Plan

### Phase 1: Measurement & Profiling

- Establish baseline metrics for all operations
- Create performance tracking dashboard or logs
- Document current slowest operations
- Set performance targets and SLAs

### Phase 2: Low-Hanging Fruit

- Implement quick wins (e.g., parallel lint/type-check)
- Configure tsup for incremental builds
- Add concurrent test execution where applicable
- Cache workspace-analyzer results

### Phase 3: Structural Improvements

- Refactor test organization if needed
- Optimize workspace scanning with incremental analysis
- Implement selective CI runs
- Update CI/CD caching strategies

### Phase 4: Advanced Optimizations

- Implement test result caching
- Add dynamic test sharding
- Optimize AST parsing and caching
- Create performance regression detection

## Validation & Monitoring

1. **Performance Testing**:
   - Benchmark improvements against baseline
   - Run performance tests in CI to catch regressions
   - Compare before/after metrics
   - Document achieved improvements

2. **Monitoring**:
   - Track build times across commits
   - Monitor CI execution times
   - Alert on performance regressions
   - Collect developer feedback on improvements

3. **Documentation**:
   - Document optimization strategies employed
   - Create guides for maintaining performance
   - Update AGENTS.md with new commands or workflows
   - Share performance wins with team

## Success Criteria

- [ ] Reduce full `pnpm validate` time by at least 20%
- [ ] Incremental builds complete in < 5 seconds
- [ ] Test suite completes in < 30 seconds (target)
- [ ] `pnpm analyze` completes in < 10 seconds for typical changes
- [ ] CI pipeline completes in < 5 minutes
- [ ] No loss of code quality or test coverage
- [ ] Improvements documented and reproducible
