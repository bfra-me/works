# @bfra.me/tsconfig

> Shared TypeScript configuration for bfra.me.

## Install

The main `tsconfig.json` config file extends from [@tsconfig/strictest](https://npmjs.com/package/@tsconfig/strictest) which is installed as a peer dependency.

### NPM

```sh
npm install --save-dev @bfra.me/tsconfig typescript
```

### PNPM

```sh
pnpm add --save-dev @bfra.me/tsconfig typescript
```

### Yarn

```sh
yarn add --dev @bfra.me/tsconfig typescript
```

## Usage

Create a `tsconfig.json` file in your project and extend this shared configuration:

```json
{
  "extends": "@bfra.me/tsconfig"
}
```

## License

[MIT](../../LICENSE.md)
