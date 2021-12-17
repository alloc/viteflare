/**
 * Copied from https://github.com/cloudflare/wrangler2/blob/7858ca2d0067920f3cee0cc00ae410883ab4cd68/packages/wrangler/src/config.ts
 */
import TOML from '@iarna/toml'
import { readFile } from 'fs/promises'
import kleur from 'kleur'
import path from 'path'
import type { Config } from 'wrangler/src/config'
import { log } from '../log'
import { ensureLoggedIn } from './login'

export async function readConfig(root: string): Promise<Config> {
  const configPath = path.join(root, 'wrangler.toml')
  const config: Record<string, any> = {}

  if (root) {
    let tml: string
    try {
      tml = await readFile(configPath, 'utf-8')
    } catch (e: any) {
      if (e.code == 'ENOENT') {
        log(
          `Expected %s to exist in root directory`,
          kleur.yellow('wrangler.toml')
        )
        process.exit(1)
      }
      throw e
    }
    const parsed = TOML.parse(tml)
    Object.assign(config, parsed)
  }

  await ensureLoggedIn(config)

  Object.keys(config.env || {}).forEach(env => {
    inheritedFields.forEach(field => {
      if (config[field] !== undefined && config.env[env][field] === undefined) {
        config.env[env][field] = config[field] // TODO: - shallow copy?
      }
    })
    mirroredFields.forEach(field => {
      // if it exists on top level, it should exist on env defns
      Object.keys(config[field] || {}).forEach(fieldKey => {
        if (!(fieldKey in config.env[env][field])) {
          log(
            kleur.yellow('warn'),
            `Environment ${kleur.cyan(env)} is missing "${field}.${fieldKey}"` +
              ` because top-level "${field}" are not inherited.`
          )
        }
      })
    })
  })

  config.__path__ = configPath
  return config
}

export function ConfigError(prop: keyof Config) {
  return Error(`Worker must have "${prop}" defined in wrangler.toml`)
}

const mirroredFields = ['vars', 'kv_namespaces', 'durable_objects']

const inheritedFields = [
  'name',
  'account_id',
  'workers_dev',
  'compatibility_date',
  'compatibility_flags',
  'zone_id',
  'routes',
  'route',
  'jsx_factory',
  'jsx_fragment',
  'polyfill_node',
  'site',
  'triggers',
  'usage_model',
]
