/// <reference types="@cloudflare/workers-types" />

export const defineWorker = <Env = Record<string, any>>(
  worker: ExportedHandler<Env>
) => worker
