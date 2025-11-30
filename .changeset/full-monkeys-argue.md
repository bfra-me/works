---
"@bfra.me/badge-config": minor
---

Add `githubActions` preset generator for GitHub Actions workflow status badges

- New `githubActions()` function generates dynamic Shields.io badge URLs for GitHub Actions workflows
- Supports custom workflow names (with automatic URL encoding for spaces/special characters)
- Configurable options: `repository`, `workflow`, `branch`, `event`, `label`, `style`, `logo`, `logoColor`, `cacheSeconds`
- Defaults to the `githubactions` logo
- Exports `GitHubActionsOptions` and `GitHubActionsResult` types
