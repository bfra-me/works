# @bfra.me/workspace-analyzer

## 0.1.0
### Minor Changes


- feat(workspace-analyzer): add comprehensive monorepo static analysis package ([#2434](https://github.com/bfra-me/works/pull/2434))
  
  This new package provides workspace analysis through deep AST parsing and static analysis, detecting:
  
  - **Configuration issues**: Inconsistencies across package.json, tsconfig.json, eslint.config.ts, and tsup.config.ts
  - **Dependency problems**: Unused dependencies, circular imports with Tarjan's algorithm, duplicate dependencies, peer dependency validation
  - **Architectural violations**: Layer boundary violations, barrel export misuse, public API enforcement
  - **Performance opportunities**: Tree-shaking blockers, dead code, large dependencies
  
  Features:
  - Modern CLI with `@clack/prompts` interactive TUI
  - Programmatic API with `analyzeWorkspace()` and `analyzePackages()` functions
  - Multiple output formats: Console, JSON, Markdown
  - Incremental analysis with content-based caching
  - Type-safe configuration with `defineConfig()` helper
  - Extensible analyzer registry architecture
  
  Built on proven infrastructure from `@bfra.me/es` (Result types, async utilities) and `@bfra.me/doc-sync` (TypeScript parsing with ts-morph).
