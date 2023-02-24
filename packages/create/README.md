@bfra.me/create
===============

bfra.me create commands

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@bfra.me/create.svg)](https://npmjs.org/package/@bfra.me/create)
[![Downloads/week](https://img.shields.io/npm/dw/@bfra.me/create.svg)](https://npmjs.org/package/@bfra.me/create)
[![License](https://img.shields.io/npm/l/@bfra.me/create.svg)](https://github.com/bfra-me/works/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g @bfra.me/create
$ create COMMAND
running command...
$ create (--version)
@bfra.me/create/0.0.0 darwin-arm64 node-v18.12.1
$ create --help [COMMAND]
USAGE
  $ create COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`create hello PERSON`](#create-hello-person)
* [`create hello world`](#create-hello-world)
* [`create help [COMMANDS]`](#create-help-commands)
* [`create plugins`](#create-plugins)
* [`create plugins:install PLUGIN...`](#create-pluginsinstall-plugin)
* [`create plugins:inspect PLUGIN...`](#create-pluginsinspect-plugin)
* [`create plugins:install PLUGIN...`](#create-pluginsinstall-plugin-1)
* [`create plugins:link PLUGIN`](#create-pluginslink-plugin)
* [`create plugins:uninstall PLUGIN...`](#create-pluginsuninstall-plugin)
* [`create plugins:uninstall PLUGIN...`](#create-pluginsuninstall-plugin-1)
* [`create plugins:uninstall PLUGIN...`](#create-pluginsuninstall-plugin-2)
* [`create plugins update`](#create-plugins-update)

## `create hello PERSON`

Say hello

```
USAGE
  $ create hello PERSON -f <value>

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

## `create hello world`

Say hello world

```
USAGE
  $ create hello world

DESCRIPTION
  Say hello world

EXAMPLES
  $ create hello world
  hello world! (./src/commands/hello/world.ts)
```

## `create help [COMMANDS]`

Display help for create.

```
USAGE
  $ create help [COMMANDS] [-n]

ARGUMENTS
  COMMANDS  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for create.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v5.2.5/src/commands/help.ts)_

## `create plugins`

List installed plugins.

```
USAGE
  $ create plugins [--core]

FLAGS
  --core  Show core plugins.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ create plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v2.3.2/src/commands/plugins/index.ts)_

## `create plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ create plugins:install PLUGIN...

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
  $ create plugins add

EXAMPLES
  $ create plugins:install myplugin 

  $ create plugins:install https://github.com/someuser/someplugin

  $ create plugins:install someuser/someplugin
```

## `create plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ create plugins:inspect PLUGIN...

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
  $ create plugins:inspect myplugin
```

## `create plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ create plugins:install PLUGIN...

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
  $ create plugins add

EXAMPLES
  $ create plugins:install myplugin 

  $ create plugins:install https://github.com/someuser/someplugin

  $ create plugins:install someuser/someplugin
```

## `create plugins:link PLUGIN`

Links a plugin into the CLI for development.

```
USAGE
  $ create plugins:link PLUGIN

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
  $ create plugins:link myplugin
```

## `create plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ create plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ create plugins unlink
  $ create plugins remove
```

## `create plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ create plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ create plugins unlink
  $ create plugins remove
```

## `create plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ create plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ create plugins unlink
  $ create plugins remove
```

## `create plugins update`

Update installed plugins.

```
USAGE
  $ create plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```
<!-- commandsstop -->
