import { defineConfig } from 'vite'

const checkerPlugin = getCheckerPlugin('vite-esbuild-typescript-checker')

export default defineConfig({
  plugins: [checkerPlugin],
})

type PluginId =
  | 'vite-esbuild-typescript-checker'
  | 'vite-plugin-checker'
  | 'vite-plugin-ts-types'

function getCheckerPlugin(pluginId: PluginId) {
  const pluginConfigs: Partial<Record<PluginId, any>> = {
    'vite-esbuild-typescript-checker': {
      checker: {
        async: false,
        typescript: {
          enabled: true,
        },
      },
    },
  }

  return require(pluginId)[
    pluginId.includes('esbuild') ? 'VitePlugin' : 'default'
  ](pluginConfigs[pluginId])
}
