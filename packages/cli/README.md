@bfra.me/cli
============

bfra.me command line

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@bfra.me/cli.svg)](https://npmjs.org/package/@bfra.me/cli)
[![Downloads/week](https://img.shields.io/npm/dw/@bfra.me/cli.svg)](https://npmjs.org/package/@bfra.me/cli)
[![License](https://img.shields.io/npm/l/@bfra.me/cli.svg)](https://github.com/bfra-me/works/blob/master/package.json)

<!-- toc -->
- [Usage](#usage)
- [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g @bfra.me/cli
$ bfra.me COMMAND
running command...
$ bfra.me (--version)
@bfra.me/cli/0.0.0 darwin-arm64 node-v18.12.1
$ bfra.me --help [COMMAND]
USAGE
  $ bfra.me COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
- [`bfra.me hello PERSON`](#bframe-hello-person)
- [`bfra.me hello world`](#bframe-hello-world)
- [`bfra.me help [COMMANDS]`](#bframe-help-commands)
- [`bfra.me plugins`](#bframe-plugins)
- [`bfra.me plugins:install PLUGIN...`](#bframe-pluginsinstall-plugin)
- [`bfra.me plugins:inspect PLUGIN...`](#bframe-pluginsinspect-plugin)
- [`bfra.me plugins:install PLUGIN...`](#bframe-pluginsinstall-plugin-1)
- [`bfra.me plugins:link PLUGIN`](#bframe-pluginslink-plugin)
- [`bfra.me plugins:uninstall PLUGIN...`](#bframe-pluginsuninstall-plugin)
- [`bfra.me plugins:uninstall PLUGIN...`](#bframe-pluginsuninstall-plugin-1)
- [`bfra.me plugins:uninstall PLUGIN...`](#bframe-pluginsuninstall-plugin-2)
- [`bfra.me plugins update`](#bframe-plugins-update)

## `bfra.me hello PERSON`

Say hello

```
USAGE
  $ bfra.me hello PERSON -f <value>

ARGUMENTS
  PERSON  Person to say hello to

FLAGS
  -f, --from=<value>  (required) Who is saying hello

DESCRIPTION
  Say hello

EXAMPLES
  $ oex hello friend --from oclif
  hello friend from oclif! (./src/commands/hello/index.ts)
```

_See code: [dist/commands/hello/index.ts](https://github.com/bfra-me/works/blob/v0.0.0/dist/commands/hello/index.ts)_

## `bfra.me hello world`

Say hello world

```
USAGE
  $ bfra.me hello world

DESCRIPTION
  Say hello world

EXAMPLES
  $ bfra.me hello world
  hello world! (./src/commands/hello/world.ts)
```

## `bfra.me help [COMMANDS]`

Display help for bfra.me.

```
USAGE
  $ bfra.me help [COMMANDS] [-n]

ARGUMENTS
  COMMANDS  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for bfra.me.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v5.2.5/src/commands/help.ts)_

## `bfra.me plugins`

List installed plugins.

```
USAGE
  $ bfra.me plugins [--core]

FLAGS
  --core  Show core plugins.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ bfra.me plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v2.3.2/src/commands/plugins/index.ts)_

## `bfra.me plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ bfra.me plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installs a plugin into the CLI.
  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.


ALIASES
  $ bfra.me plugins add

EXAMPLES
  $ bfra.me plugins:install myplugin

  $ bfra.me plugins:install https://github.com/someuser/someplugin

  $ bfra.me plugins:install someuser/someplugin
```

## `bfra.me plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ bfra.me plugins:inspect PLUGIN...

ARGUMENTS
  PLUGIN  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ bfra.me plugins:inspect myplugin
```

## `bfra.me plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ bfra.me plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installs a plugin into the CLI.
  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.


ALIASES
  $ bfra.me plugins add

EXAMPLES
  $ bfra.me plugins:install myplugin

  $ bfra.me plugins:install https://github.com/someuser/someplugin

  $ bfra.me plugins:install someuser/someplugin
```

## `bfra.me plugins:link PLUGIN`

Links a plugin into the CLI for development.

```
USAGE
  $ bfra.me plugins:link PLUGIN

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Links a plugin into the CLI for development.
  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ bfra.me plugins:link myplugin
```

## `bfra.me plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ bfra.me plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ bfra.me plugins unlink
  $ bfra.me plugins remove
```

## `bfra.me plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ bfra.me plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ bfra.me plugins unlink
  $ bfra.me plugins remove
```

## `bfra.me plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ bfra.me plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ bfra.me plugins unlink
  $ bfra.me plugins remove
```

## `bfra.me plugins update`

Update installed plugins.

```
USAGE
  $ bfra.me plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```
<!-- commandsstop -->
