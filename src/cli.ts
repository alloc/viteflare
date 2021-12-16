import cac from 'cac'
import { statSync } from 'fs-extra'
import path from 'path'
import publish from 'wrangler/src/publish'
import { log } from './log'
import { cacheDir, createBundle } from './node/bundle'
import { ConfigError, readConfig } from './node/config'
import { develop } from './node/dev'
import { ensureLoggedIn } from './node/login'

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
      type: String as any,
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
    .option('--name', 'Publish under another name', {
      type: String as any,
    })
    .option('--minify', 'Minify the worker bundle', {
      type: Boolean as any,
      default: true,
    })
    .option('jsx-factory', 'The function that is called for each JSX element', {
      type: String as any,
    })
    .option(
      'jsx-fragment',
      'The function that is called for each JSX fragment',
      {
        type: String as any,
      }
    )
    .action(async (root = process.cwd(), options) => {
      const config = await readConfig(root)
      await ensureLoggedIn(config)
      if (!config.name && !options.name) {
        throw ConfigError('name')
      }

      const bundle = await createBundle(root, 'production', options.minify)
      bundle.on('bundle', () => {
        bundle.close()
        log(`Publishing...`)
        publish({
          config,
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
