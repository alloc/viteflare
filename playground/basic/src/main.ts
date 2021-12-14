import { defineWorker } from 'viteflare'
import { getUser } from './user'

export default defineWorker({
  fetch(request, bindings, context) {
    const result = `hello user #${getUser()}`
    console.log(result)
    return Promise.resolve(new Response(result))
  },
})
