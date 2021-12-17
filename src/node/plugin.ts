import * as vite from 'vite'
import { Config } from 'wrangler/src/config'
import { PublishFlags } from '../types'
import { Bundle } from './bundle'
import { HotKeys } from './hotkey'

type Promisable<T> = T | Promise<T>
type DevServer = {
  hotKeys?: HotKeys
  close(): void
}

interface DevContext {
  port: number
  config: Config
  /**
   * Restart the dev server with the given bundle.
   *
   * The optional `error` is logged if defined. This ensures the error
   * is logged after the console is cleared.
   */
  serve: (code: string, error?: Error) => void
}

export type DevelopWorkerHook = (
  code: string,
  context: DevContext
) => Promisable<DevServer>

export interface Plugin extends vite.Plugin {
  /**
   * The first plugin to implement this hook is responsible for starting
   * a HTTP server that emulates a Cloudflare worker environment, and then
   * running the given code within that.
   */
  developWorker?: DevelopWorkerHook

  /**
   * The first plugin to implement this hook is responsible for deploying
   * the worker to the appropriate URL based on the given config.
   */
  publishWorker?(
    code: string,
    config: Config,
    flags: PublishFlags
  ): Promisable<void>

  /**
   * When a command to ViteFlare is unexpected, this hook will be called.
   * This allows forwarding to another CLI.
   */
  runCommand?(argv: string[]): Promisable<void>
}

export async function findWorkerPlugin(
  hook: Exclude<keyof Plugin, keyof vite.Plugin>,
  config?: vite.ResolvedConfig
): Promise<Plugin> {
  if (!config) {
    config = await vite.resolveConfig({}, 'serve')
  }
  return (
    (config.plugins as Plugin[]).find(plugin => plugin[hook]) ||
    (await import('../cloudflare/plugin')).CloudFlarePlugin
  )
}
