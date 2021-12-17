import cac from 'cac'
import { statSync } from 'fs-extra'
import path from 'path'
import { log } from './log'
import { cacheDir, createBundle } from './node/bundle'
import { ConfigError, readConfig } from './node/config'
import { develop } from './node/dev'
import { findWorkerPlugin } from './node/plugin'

export async function main(argv: string[]) {
  const app = cac('viteflare')
    .version(require('../package.json').version)
    .help()

  app
    .command('[root]', 'Start development mode')
    .option('--port <port>', 'Set proxy server port', {
      type: Number as any,
      default: 8787,
    })
    .option('--mode <mode>', `Set bundle mode (eg: "production")`, {
      default: 'development',
    })
    .action((root = process.cwd(), options) => {
      if (isDirectory(root)) {
        return develop(root, options)
      }
      // Fall back to wrangler.
      throw { name: 'CACError' }
    })

  app
    .command('publish [root]', 'Publish your worker to the orange cloud')
    .option('-D, --dev', 'Publish to workers.dev')
    .option('-E, --env <string>', 'Use an environment from wrangler.toml')
    .option('--name <string>', 'Publish under another name')
    .option('--minify', 'Minify the worker bundle', {
      default: true,
    })
    .option(
      '--jsx-factory <string>',
      'The function called for each JSX element'
    )
    .option(
      '--jsx-fragment <string>',
      'The function called for each JSX fragment'
    )
    .action(async (root, options) => {
      if (root) process.chdir(root)
      else root = process.cwd()

      const config = await readConfig(root, options)
      if (options.name) {
        config.name = options.name
      } else if (!config.name) {
        throw ConfigError('name')
      }

      const bundle = await createBundle(root, 'production', options.minify)
      bundle.on('bundle', async code => {
        bundle.close()
        log(`Publishing...`)
        const { publishWorker } = await findWorkerPlugin(
          'publishWorker',
          bundle.server.config
        )
        publishWorker!(code, config, options)
      })
    })

  try {
    app.parse(argv)
  } catch (e: any) {
    if (e.name !== 'CACError') {
      throw e
    }
    if (app.matchedCommand?.name === '' && !isDirectory(argv[2])) {
      const { runCommand } = await findWorkerPlugin('runCommand')
      return runCommand!(argv.slice(2))
    }
    const { red } = require('kleur')
    console.error(red(e.message))
  }
}

function isDirectory(path: string) {
  try {
    return statSync(path).isDirectory()
  } catch {
    return false
  }
}
