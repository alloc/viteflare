import { defineWorker } from 'viteflare'

export default defineWorker({
  fetch(request, bindings, context) {
    return Promise.resolve(new Response(200))
  },
})
