import { defineConfig } from 'vite'
import { VitePlugin as tsChecker } from 'vite-esbuild-typescript-checker'

export default defineConfig({
  plugins: [
    tsChecker({
      vite: { overlay: false },
      checker: {
        async: false,
        typescript: {
          enabled: true,
        },
      },
    }),
  ],
})
