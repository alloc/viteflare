import cac from 'cac'
import kleur from 'kleur'
import { clear } from 'misty'
import open from 'open'
import path from 'path'
import {
  getAccountId,
  initialise,
  loginOrRefreshIfRequired,
} from 'wrangler/src/user'
import publish from 'wrangler/src/publish'
import { log } from './log'
import { cacheDir, createBundle } from './node/bundle'
import { ConfigError, readConfig } from './node/config'
import { useDevToolsRefresh } from './node/devtools'
import { HotKeys, printHotKeys, useHotKeys } from './node/hotkey'
import { useInspector } from './node/inspector'
import { useProxy } from './node/proxy'
import { getPreviewToken } from './node/worker'
import { Config } from 'wrangler/src/config'

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
    .action(async (root = process.cwd(), options) => {
      const devToolsRefresh = useDevToolsRefresh()
      const config = await readConfig(path.join(root, 'wrangler.toml'))
      await login(config)

      const hotKeys: HotKeys = {
        b: {
          desc: `open browser`,
          run: () => open(serverUrl),
        },
        d: {
          desc: `open debugger`,
          run: () =>
            open(
              `https://built-devtools.pages.dev/js_app?experiments=true&v8only=true&ws=localhost:9229/ws`
            ),
        },
      }

      useHotKeys(key => {
        hotKeys[key]?.run()
      })

      let serverUrl: string
      let serverPromise: Promise<{ close(): void }> | undefined

      function serve(bundle: string, e?: Error) {
        const oldServerPromise = serverPromise
        serverPromise = (async () => {
          if (oldServerPromise) {
            const oldServer = await oldServerPromise
            oldServer.close()
            clear()
            e && console.error(e.message)
          }

          log(serverPromise ? 'Restarting server...' : 'Starting server...')
          const token = await getPreviewToken(bundle, config)

          const proxy = useProxy(token, options.port, e => serve(bundle, e))
          const inspector = useInspector(token)

          serverUrl = `http://localhost:${options.port}`
          log(`Listening at ${kleur.green(serverUrl)}`)
          printHotKeys(hotKeys)

          return {
            close() {
              inspector.close()
              proxy.close()
            },
          }
        })()
      }

      const bundle = await createBundle(root, options.mode)
      bundle.on('bundle', bundle => {
        devToolsRefresh.bundleId++
        serve(bundle)
      })
    })

  app
    .command('publish [root]', 'Publish your worker to the orange cloud')
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
      const config = await readConfig(path.join(root, 'wrangler.toml'))
      await login(config)
      if (!config.name) {
        throw ConfigError('name')
      }

      const bundle = await createBundle(root, 'production', options.minify)
      bundle.on('bundle', () => {
        bundle.close()
        log(`Publishing...`)
        publish({
          config,
          name: config.name!,
          script: path.join(cacheDir, 'bundle.js'),
          jsxFactory: options.jsxFactory,
          jsxFragment: options.jsxFragment,
        })
      })
    })

  app.parse(argv)
}

async function login(config: Config) {
  await initialise()
  const loggedIn = await loginOrRefreshIfRequired()
  if (!loggedIn) {
    log('Login failed')
    process.exit(1)
  }
  if (!config.account_id) {
    config.account_id = await getAccountId()
    if (!config.account_id) {
      log('Account ID not found')
      process.exit(1)
    }
  }
}
