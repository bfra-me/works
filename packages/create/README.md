# @bfra.me/create

A command line utility to create new packages from customizable templates.

## Installation

You can install `@bfra.me/create` using your preferred package manager:

```bash
# npm
npm install -g @bfra.me/create

# Yarn
yarn global add @bfra.me/create

# pnpm
pnpm add -g @bfra.me/create
```

Alternatively, you can use `npx` without installing:

```bash
npx @bfra.me/create <package-name> [options]
```

## Usage

### CLI

To create a new package, run:

```bash
create <package-name> [options]
```

#### Options

- `<package-name>`: The name of the package you want to create.
- `-t`, `--template` (string): Template to use. Default is `default`.
- `-v`, `--version` (string): Package version. Default is `1.0.0`.
- `-d`, `--description` (string): Package description.
- `--author` (string): Author of the package.

#### Example

Create a new package named `my-new-package` using the default template:

```bash
create my-new-package
```

Create a package with a specific template and description:

```bash
create my-new-package --template my-template --description "This is my new package"
```

### Programmatic API

You can also use `@bfra.me/create` programmatically:

```js
import {createPackage} from "@bfra.me/create"

await createPackage("my-new-package", {
  template: "default",
  version: "1.0.0",
  description: "A new package",
  author: "Your Name",
})
```

#### `createPackage(packageName: string, options: CreatePackageOptions): Promise<void>`

Creates a new package with the given name and options.

##### Parameters

- `packageName` (string): The name of the package to create.
- `options` (CreatePackageOptions): An object containing the following optional properties:
  - `template` (string): The template to use.
  - `version` (string): The version of the package.
  - `description` (string): The description of the package.
  - `author` (string): The author of the package.

## Available Templates

The following built-in templates are available in the `templates/` directory:

- **default** - Basic TypeScript package template
- **library** - NPM library template with TypeScript, testing, and build setup
- **cli** - Command-line interface application template with CAC and Consola
- **node** - Node.js server application template with Fastify
- **react** - React application template with Vite and TypeScript

### Custom Templates

You can use custom templates by specifying:

- GitHub repositories: `user/repo` or `github:user/repo#branch`
- Local directories: `./path/to/template` or `/absolute/path/to/template`
- URLs: `https://example.com/template.zip`

### Template Structure

Templates are located in the `templates/` directory at the root of the package. Each template contains:

- Template files with Eta templating syntax (`<%= it.variable %>`)
- A `template.json` file with metadata and variable definitions
- Source files, configuration files, and documentation

## License

This project is licensed under the MIT License.
