import { createWorker } from 'wrangler/src/api/worker'
import { getAPIToken } from 'wrangler/src/user'
import { Config } from 'wrangler/src/config'
import { ConfigError } from '../node/config'

export async function getPreviewToken(bundle: string, config: Config) {
  if (!config.name) {
    throw ConfigError('name')
  }
  if (!config.account_id) {
    throw ConfigError('account_id')
  }
  return createWorker(
    {
      name: config.name!,
      main: {
        name: config.name!,
        type: 'esm',
        content: bundle,
      },
      modules: [],
      variables: config.vars,
    },
    {
      accountId: config.account_id,
      apiToken: getAPIToken(),
    }
  )
}
