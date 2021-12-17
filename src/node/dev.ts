import kleur from 'kleur'
import { clear } from 'misty'
import { log } from '../log'
import { createBundle } from './bundle'
import { readConfig } from './config'
import { DevToolsRefresh, useDevToolsRefresh } from './devtools'
import { HotKeys, printHotKeys, useHotKeys } from './hotkey'
import { useInspector } from './inspector'
import { useProxy } from './proxy'
import { getPreviewToken } from './worker'

export async function develop(root: string, options: any) {
  const config = await readConfig(root)

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
    let newServerPromise: typeof serverPromise
    serverPromise = newServerPromise = (async () => {
      if (oldServerPromise) {
        const oldServer = await oldServerPromise.catch(() => {})
        oldServer?.close()

        // This might not be the newest `serve` call anymore.
        if (serverPromise !== newServerPromise) {
          return { close() {} }
        }

        clear()
        error && logError(error)
        log('Restarting server...')
      } else {
        log('Starting server...')
      }

      // Deploy the worker to a production-like remote environment.
      const token = await getPreviewToken(bundle, config)

      let closed = false
      const restartOnError = (e: any) => !closed && serve(bundle, e)

      // Expose the deployed worker locally.
      const proxy = useProxy(token, options.port, restartOnError)
      const inspector = useInspector(token, restartOnError)

      serverUrl = `http://localhost:${options.port}`
      log(`Listening at ${kleur.green(serverUrl)}`)
      printHotKeys(hotKeys)

      return {
        close() {
          closed = true
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
