import { defineWorker } from 'viteflare'
import { getUser } from './user'

interface Env {
  /* Bindings go here */
}

export default defineWorker<Env>({
  fetch(request, env, context) {
    const result = `hello user #${getUser()}`

    // Logs will show directly in the terminal in a future version.
    // For now, you can see them by opening the debugger.
    console.log(result)

    return Promise.resolve(new Response(result))
  },
})
