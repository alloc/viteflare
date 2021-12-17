import cac from 'cac'
import { statSync } from 'fs-extra'
import kleur from 'kleur'
import path from 'path'
import publish from 'wrangler/src/publish'
import { log } from './log'
import { cacheDir, createBundle } from './node/bundle'
import { ConfigError, readConfig } from './node/config'
import { develop } from './node/dev'

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
    .option('-E, --env', 'Use an environment from wrangler.toml')
    .option('--name', 'Publish under another name')
    .option('--minify', 'Minify the worker bundle', {
      default: true,
    })
    .option('--jsx-factory', 'The function called for each JSX element')
    .option('--jsx-fragment', 'The function called for each JSX fragment')
    .action(async (root = process.cwd(), options) => {
      const config = await readConfig(root)
      if (!config.name && !options.name) {
        throw ConfigError('name')
      }
      if (options.dev) {
        config.workers_dev = true
        options.env ||= 'dev'
      }
      if (options.env && options.env !== 'dev' && !config.env?.[options.env]) {
        log(`Environment ${kleur.cyan(options.env)} does not exist`)
        process.exit(1)
      }

      const bundle = await createBundle(root, 'production', options.minify)
      bundle.on('bundle', () => {
        bundle.close()
        log(`Publishing...`)
        publish({
          config,
          env: options.env,
          name: options.name || config.name!,
          script: path.join(root, cacheDir, 'bundle.js'),
          jsxFactory: options.jsxFactory,
          jsxFragment: options.jsxFragment,
        })
      })
    })

  try {
    app.parse(argv)
  } catch (e: any) {
    if (e.name !== 'CACError') {
      throw e
    }
    if (app.matchedCommand?.name === '' && !isDirectory(argv[2])) {
      // Forward commands to wrangler.
      return require('./wrangler').main(argv.slice(2))
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
