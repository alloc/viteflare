import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import resolve from '@rollup/plugin-node-resolve'
import Module from 'module'
import esbuild from 'rollup-plugin-esbuild'

const name = require('./package.json').main.replace(/\.js$/, '')

const bundle = config => ({
  external: id => !/^[./]/.test(id),
  ...config,
})

const cliExternal = [
  ...Module.builtinModules,
  '@cloudflare/pages-functions-compiler',
  '@peculiar/webcrypto',
  'esbuild',
  'ink',
  'miniflare',
  'node-abort-controller',
  'semiver',
  'source-map-support',
  'terser',
  'vite',
  'web-streams-polyfill',
]

export default [
  bundle({
    input: ['src/cli.ts', 'src/wrangler.ts'],
    external: id => cliExternal.includes(id),
    context: 'global',
    plugins: [
      validateDependencies(),
      node14Compat(),
      esbuild({ sourceMap: true }),
      json(),
      commonjs(),
      resolve({
        extensions: ['.js', '.ts', '.tsx'],
      }),
    ],
    output: {
      dir: 'dist',
      format: 'cjs',
      sourcemap: true,
      chunkFileNames: 'chunks/[name]-[hash].js',
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

// Keep dependencies in sync with Wrangler
function validateDependencies() {
  return {
    buildStart() {
      const viteflarePkg = require('./package.json')
      const wranglerPkg = require('./node_modules/wrangler/package.json')
      for (const key of ['dependencies', 'devDependencies']) {
        for (const [dep, current] of Object.entries(viteflarePkg[key])) {
          const expected =
            wranglerPkg.dependencies[dep] || wranglerPkg.devDependencies[dep]

          if (expected && expected !== current) {
            throw Error(`Expected ${dep}@${expected} but got ${current}`)
          }
        }
      }
    },
  }
}
