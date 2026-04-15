---
"@bfra.me/eslint-config": minor
---

Upgrade `@eslint-react/eslint-plugin` from v2 to v4

Adopts the unified plugin architecture introduced in v4. Key changes:

- **Unified plugin**: Sub-plugins (`@eslint-react/dom`, `@eslint-react/hooks-extra`, `@eslint-react/naming-convention`, `@eslint-react/web-api`) are now merged into a single `@eslint-react` plugin
- **Recommended ruleset**: Uses `pluginReact.configs.recommended.rules` spread instead of manually listing ~40 individual rules, keeping the config aligned with upstream defaults
- **Removed rules**: Rules deleted in v4 (`no-default-props`, `no-prop-types`, `jsx-no-duplicate-props`, `jsx-uses-vars`, `no-string-refs`, `no-useless-forward-ref`, `prefer-use-state-lazy-initialization`) are no longer configured
- **Hooks coverage**: v4's unified plugin includes hooks rules (`rules-of-hooks`, `exhaustive-deps`) via the recommended config; `eslint-plugin-react-hooks` remains as a peer dependency for consumers using it directly
- **Peer dependency**: Updated from `^2.2.3` to `^4.2.3`
