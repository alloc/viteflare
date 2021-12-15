import kleur from 'kleur'
import { clear } from 'misty'
import { log } from '../log'
import { createBundle } from './bundle'
import { readConfig } from './config'
import { DevToolsRefresh, useDevToolsRefresh } from './devtools'
import { HotKeys, printHotKeys, useHotKeys } from './hotkey'
import { useInspector } from './inspector'
import { ensureLoggedIn } from './login'
import { useProxy } from './proxy'
import { getPreviewToken } from './worker'

export async function develop(root: string, options: any) {
  const config = await readConfig(root)
  await ensureLoggedIn(config)

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

  function serve(bundle: string, error?: Error) {
    const oldServerPromise = serverPromise
    serverPromise = (async () => {
      if (oldServerPromise) {
        const oldServer = await oldServerPromise
        oldServer.close()
        clear()
        error && logError(error)
      }

      log(serverPromise ? 'Restarting server...' : 'Starting server...')
      const token = await getPreviewToken(bundle, config)

      const proxy = useProxy(token, options.port, e => serve(bundle, e))
      const inspector = useInspector(token, e => serve(bundle, e))

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

    serverPromise.catch(logError)
  }

  let devToolsRefresh: DevToolsRefresh

  const bundle = await createBundle(root, options.mode)
  bundle.on('bundle', bundle => {
    serve(bundle)

    // Initialize this after the proxy server is opened,
    // so StackBlitz opens the correct URL.
    devToolsRefresh ||= useDevToolsRefresh()
    devToolsRefresh.bundleId++
  })
}

function logError(e: any) {
  console.error('\n' + kleur.red(e.constructor.name + ': ' + e.message))
}
