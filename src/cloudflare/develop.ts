import { DevelopWorkerHook } from '../node/plugin'
import { useInspector } from './inspector'
import { useProxy } from './proxy'
import { getPreviewToken } from './worker'

const develop: DevelopWorkerHook = async (code, { port, config, serve }) => {
  // Deploy the worker to a production-like remote environment.
  const token = await getPreviewToken(code, config)

  let closed = false
  const restartOnError = (e: any) => !closed && serve(code, e)

  // Expose the deployed worker locally.
  const proxy = useProxy(token, port, restartOnError)
  const inspector = useInspector(token, restartOnError)

  return {
    close() {
      closed = true
      inspector.close()
      proxy.close()
    },
    hotKeys: {
      d: {
        desc: `open debugger`,
        run: () =>
          open(
            `https://built-devtools.pages.dev/js_app?experiments=true&v8only=true&ws=localhost:9229/ws`
          ),
      },
    },
  }
}

export default develop
