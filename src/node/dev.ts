import kleur from 'kleur'
import { clear } from 'misty'
import { log } from '../log'
import { createBundle } from './bundle'
import { readConfig } from './config'
import { DevToolsRefresh, useDevToolsRefresh } from './devtools'
import { HotKeys, printHotKeys, useHotKeys } from './hotkey'
import { findWorkerPlugin, Plugin } from './plugin'

export async function develop(root: string, options: any) {
  const config = await readConfig(root)

  let serverUrl: string
  let serverPromise: Promise<{ close(): void }> | undefined
  let devToolsRefresh: DevToolsRefresh
  let workerPlugin: Plugin
  let hotKeys: HotKeys | undefined

  const bundle = await createBundle(root, options.mode)
  bundle.on('bundle', async code => {
    serve(code)

    // Initialize this after the proxy server is opened,
    // so StackBlitz opens the correct URL.
    devToolsRefresh ||= useDevToolsRefresh()
    devToolsRefresh.bundleId++
  })

  function serve(code: string, error?: Error) {
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

      workerPlugin ||= await findWorkerPlugin(
        'developWorker',
        bundle.server.config
      )

      const devServer = await workerPlugin.developWorker!(code, {
        port: options.port,
        config,
        serve,
      })

      serverUrl = `http://localhost:${options.port}`
      log(`Listening at ${kleur.green(serverUrl)}`)
      printHotKeys(
        (hotKeys = {
          b: {
            desc: `open browser`,
            run: () => open(serverUrl),
          },
          ...devServer.hotKeys,
        })
      )

      return devServer
    })()

    serverPromise.catch(logError)
  }

  useHotKeys(key => {
    hotKeys?.[key]?.run()
  })
}

function logError(e: any) {
  console.error('\n' + kleur.red(e.constructor.name + ': ' + e.message))
}
