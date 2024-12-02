import cac from 'cac'
import consola from 'consola'
import {name, version} from '../package.json'
import {createPackage} from './index.js'
// const {name} = await import('../package.json', {assert: {type: 'json'}})

const cli = cac(name)

cli.command('[projectPath]', 'Create a new project').action(async (projectPath?: string) => {
  try {
    await createPackage({
      outputDir: projectPath ?? process.cwd(),
    })
    console.log(`Package "${projectPath}" has been created successfully.`)
  } catch (error) {
    consola.error(error)
    process.exit(1)
  }
})
cli.help()
cli.version(version)
cli.parse()
