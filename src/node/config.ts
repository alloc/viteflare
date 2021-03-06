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

export async function readConfig(
  root: string,
  options: { dev?: boolean; env?: string } = {}
): Promise<Config> {
  const configPath = path.join(root, 'wrangler.toml')

  let configToml: string
  try {
    configToml = await readFile(configPath, 'utf-8')
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

  const config = TOML.parse(configToml) as Record<string, any>
  await ensureLoggedIn(config)

  if (options.env && !config.env?.[options.env]) {
    log(`Environment ${kleur.cyan(options.env)} does not exist`)
    process.exit(1)
  }
  if (options.dev) {
    config.workers_dev = true
    config.route = config.routes = undefined
  }

  const defaultVariables = config.vars?.default || {}
  if (config.vars?.default) {
    delete config.vars.default
  }

  Object.keys(config.env || {}).forEach(env => {
    config.env[env].vars = {
      ...defaultVariables,
      ...config.env[env].vars,
    }
    inheritedFields.forEach(field => {
      if (config[field] !== undefined && config.env[env][field] === undefined) {
        config.env[env][field] = config[field] // TODO: - shallow copy?
      }
    })
    mirroredFields.forEach(field => {
      // if it exists on top level, it should exist on env defns
      Object.keys(config[field] || {}).forEach(fieldKey => {
        const envObj = config.env[env][field]
        if (envObj && !(fieldKey in envObj)) {
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
