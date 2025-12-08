---
name: analyzePackageQuality
description: Audit an existing package for code quality, test coverage, and architectural adherence.
argument-hint: Package name or path (e.g., "@bfra.me/create" or "packages/workspace-analyzer")
---

# Analyze Package Quality and Architectural Compliance

Conduct a comprehensive quality and compliance audit of an existing package in the monorepo. This analysis identifies refactoring opportunities, test gaps, and architectural violations while maintaining existing functionality.

## Discovery Phase

1. **Code Structure Review**:
   - Examine the barrel export in `src/index.ts` - verify all exports are explicit named exports with no `export *` in application code
   - Scan all source files for patterns that violate established conventions (default exports, namespace exports, circular references)
   - Check module organization against the project's file structure standards

2. **Type Safety Assessment**:
   - Verify TypeScript strict mode compliance (`noUncheckedIndexedAccess`, etc.)
   - Identify any `any` type usage or type assertions that bypass safety checks
   - Check for proper use of discriminated unions and branded types
   - Assess error handling patterns - count throws vs Result<T, E> usage

3. **Testing Coverage Analysis**:
   - Identify test file locations and naming patterns
   - Calculate code coverage percentages (target: 80% statements, 75% branches)
   - Check for use of `it.concurrent()` for parallel test execution
   - Verify fixture-based testing approach with input/output directories
   - Look for file snapshots via `toMatchFileSnapshot()`

4. **Dependency Analysis**:
   - Map all internal dependencies on other @bfra.me/\* packages
   - Identify reusable utilities that could be extracted to @bfra.me/es
   - Check for duplicate implementations across packages
   - Verify workspace protocol usage (`workspace:*`)

5. **Documentation Review**:
   - Check README.md completeness (installation, usage, API reference)
   - Verify JSDoc comments on public APIs
   - Look for examples and integration guides
   - Assess documentation accuracy against actual implementation

## Analysis & Findings

Generate a findings report with three categories:

### Quality Issues (High Priority)

- Type safety violations and unsafe patterns
- Test coverage gaps (identify uncovered branches and functions)
- Missing error handling or improper error propagation
- Security vulnerabilities or unsafe operations

### Architecture Issues (Medium Priority)

- Violations of explicit export convention
- Unnecessary use of `any` or unsafe type assertions
- Circular dependencies or improper layer violations
- Missing abstractions or overly complex implementations

### Enhancement Opportunities (Low Priority)

- Extractable reusable code for @bfra.me/es
- Performance optimization possibilities
- Better use of existing utilities from @bfra.me/es/result, @bfra.me/es/async
- Documentation improvements

## Refactoring Recommendations

For each identified issue, provide:

1. **Current state**: Code snippet showing the problem
2. **Recommended approach**: How it should be refactored following monorepo patterns
3. **Effort estimate**: Small (< 1 hour), Medium (1-4 hours), Large (> 4 hours)
4. **Risk level**: Low, Medium, High based on impact on other code
5. **Test validation**: How the refactoring will be verified

## Output Format

Present findings as a structured report with:

- Executive summary of overall quality score and major categories
- Detailed findings organized by severity and area
- Prioritized refactoring roadmap with effort estimates
- Quick wins that can be addressed first
- Long-term improvements requiring significant restructuring
