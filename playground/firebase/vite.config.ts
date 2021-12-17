import { defineConfig } from 'vite'
import firebasePlugin from 'viteflare-firebase'

export default defineConfig({
  plugins: [firebasePlugin()],
})
