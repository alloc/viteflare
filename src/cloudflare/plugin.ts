import path from 'path'
import { cacheDir } from '../node/bundle'
import { Plugin } from '../plugin'

/**
 * The default plugin used to develop and publish your worker.
 */
export const CloudFlarePlugin: Plugin = {
  name: 'cloudflare',
  async developWorker(...args) {
    const develop = await import('./develop')
    return develop.default(...args)
  },
  async publishWorker(_code, config, options) {
    const publish = await import('wrangler/src/publish')
    return publish.default({
      config,
      env: options.env,
      name: config.name!,
      script: path.resolve(cacheDir, 'bundle.js'),
      jsxFactory: options.jsxFactory,
      jsxFragment: options.jsxFragment,
    })
  },
  async runCommand(argv) {
    const wrangler = await import('wrangler/src/index')
    return wrangler.main(argv)
  },
}
