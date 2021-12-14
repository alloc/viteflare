import Module from 'module'
import esbuild from 'rollup-plugin-esbuild'
import resolve from '@rollup/plugin-node-resolve'

const name = require('./package.json').main.replace(/\.js$/, '')

const bundle = config => ({
  external: id => !/^[./]/.test(id),
  ...config,
})

const cliExternal = [
  ...Module.builtinModules,
  '@iarna/toml',
  '@peculiar/webcrypto',
  'esbuild',
  'formdata-node',
  'fs-extra',
  'http-proxy',
  'misty',
  'node-abort-controller',
  'open',
  'prompts',
  'source-map',
  'terser',
  'tmp-promise',
  'vite',
  'ws',
]

export default [
  bundle({
    input: 'src/cli.ts',
    external: id => cliExternal.includes(id),
    plugins: [
      node14Compat(),
      esbuild({ sourceMap: true }),
      resolve({
        extensions: ['.ts', '.tsx'],
      }),
    ],
    output: {
      file: `dist/cli.js`,
      format: 'cjs',
      sourcemap: true,
      inlineDynamicImports: true,
    },
  }),
  bundle({
    input: 'src/worker/index.ts',
    plugins: [esbuild({ sourceMap: true })],
    output: {
      file: `${name}.js`,
      format: 'esm',
      sourcemap: true,
    },
  }),
  bundle({
    input: 'src/node14.ts',
    plugins: [esbuild({ sourceMap: true })],
    output: {
      file: `dist/node14.js`,
      format: 'cjs',
      sourcemap: true,
    },
  }),
]

// StackBlitz uses Node14
function node14Compat() {
  return {
    resolveId(id) {
      if (id.startsWith('node:')) {
        return id.slice(5)
      }
    },
  }
}
