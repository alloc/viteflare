import { Config } from 'wrangler/src/config'
import {
  getAccountId,
  initialise,
  loginOrRefreshIfRequired,
} from 'wrangler/src/user'
import { log } from '../log'

export async function ensureLoggedIn(config: Config) {
  await initialise()
  const loggedIn = await loginOrRefreshIfRequired()
  if (!loggedIn) {
    log('Login failed')
    process.exit(1)
  }
  if (!config.account_id) {
    config.account_id = await getAccountId()
    if (!config.account_id) {
      log('Account ID not found')
      process.exit(1)
    }
  }
}
