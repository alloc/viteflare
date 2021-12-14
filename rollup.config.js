import esbuild from 'rollup-plugin-esbuild'
import resolve from '@rollup/plugin-node-resolve'

const name = require('./package.json').main.replace(/\.js$/, '')

const bundle = config => ({
  input: 'src/index.ts',
  external: id => !/^[./]/.test(id),
  ...config,
})

const cliExternal = [
  '@iarna/toml',
  'esbuild',
  'formdata-node',
  'fs-extra',
  'http-proxy',
  'misty',
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
    external: id => cliExternal.includes(id) || id.startsWith('node:'),
    plugins: [
      esbuild(),
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
    plugins: [esbuild()],
    output: {
      file: `${name}.js`,
      format: 'esm',
      sourcemap: true,
    },
  }),
]
