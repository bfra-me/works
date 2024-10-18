---
"@bfra.me/eslint-config": patch
---

Add a named export for the default config and move the ESLint config that pertains to `eslint-config` into the package, as the monorepo passes the `unstable_config_lookup_from_file` feature flag to ESLint.
  