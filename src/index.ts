import '@cloudflare/workers-types'

export function defineWorker<Env>(worker: ExportedHandler<Env>) {
  return worker
}
