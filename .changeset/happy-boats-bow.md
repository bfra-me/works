---
"@bfra.me/eslint-config": minor
---

fix(eslint-config): move no-implicit-key to type-aware rules for react v2.13.0 migration

The no-implicit-key rule in @eslint-react/eslint-plugin v2.13.0 was moved from
the recommended preset to the type-checked preset and now requires type
information. This was causing lint errors when applied to JavaScript files
without type checking enabled.

Move the rule from the regular rules section to ReactTypeAwareRules so it only
applies to TypeScript files where type information is available, fixing errors
in the ts-strict-with-react and other test fixtures.
