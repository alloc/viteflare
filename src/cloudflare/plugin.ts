import { spawnSync } from 'child_process'
import fs from 'fs'
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
  runCommand(argv) {
    const wranglerDir = path.resolve(__dirname, '../../wrangler')
    if (!fs.existsSync(path.join(wranglerDir, 'node_modules'))) {
      // Install the wrangler CLI.
      spawnSync('npm', ['install'], {
        cwd: wranglerDir,
        stdio: 'inherit',
      })
    }
    spawnSync(path.join(wranglerDir, 'node_modules/.bin/wrangler'), argv, {
      stdio: 'inherit',
    })
  },
}
