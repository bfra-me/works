# @bfra.me/semantic-release

> Sharable Semantic Release configuration for bfra.me.

## Install

### NPM

```sh
npm install --save-dev @bfra.me/semantic-release semantic-release
```

### PNPM

```sh
pnpm add --save-dev @bfra.me/semantic-release semantic-release
```

### Yarn

```sh
yarn add --dev @bfra.me/semantic-release semantic-release
```

## Usage

Import the `defineConfig` utility to use in your `semantic-release` config file:

```javascript
import {defineConfig} from "@bfra.me/semantic-release"

export default defineConfig({
  branches: ["main"],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    "@semantic-release/npm",
    "@semantic-release/github",
    "@semantic-release/git",
  ],
})
```

Code editors that support TypeScript type acquisition should be able to provide type hints for the `defineConfig` function.

## License

[MIT](../../LICENSE.md)
