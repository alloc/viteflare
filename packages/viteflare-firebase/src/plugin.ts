import { Plugin } from 'viteflare/plugin'

export default (): Plugin => {
  let main: string
  return {
    name: 'firebase',
    configureServer({ config }) {
      main = config.build.ssr as string
    },
    transform(code, id) {
      if (id === main) {
        // TODO: wrap with compatibility layer
      }
    },
    developWorker() {
      return { close() {} }
    },
    publishWorker() {},
  }
}
