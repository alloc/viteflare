import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import resolve from '@rollup/plugin-node-resolve'
import Module from 'module'
import esbuild from 'rollup-plugin-esbuild'
import exec from '@cush/exec'
import fs from 'fs-extra'

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
  'react',
  'semiver',
  'source-map-support',
  'terser',
  'vite',
  'web-streams-polyfill',
]

export default [
  bundle({
    input: ['src/cli.ts', 'src/plugin.ts'],
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
      updateWranglerCommit(),
    ],
    output: {
      dir: 'dist',
      format: 'cjs',
      sourcemap: true,
      sourcemapExcludeSources: true,
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

function updateWranglerCommit() {
  const wranglerDir = 'vendor/wrangler2'
  const indoConfigPath = '.indo.json'

  return {
    writeBundle() {
      const indoConfig = fs.readJsonSync(indoConfigPath)
      indoConfig.repos[wranglerDir].head = exec
        .sync('git rev-parse head', { cwd: wranglerDir })
        .slice(0, 12)

      fs.writeFileSync(
        indoConfigPath,
        JSON.stringify(indoConfig, null, 2) + '\n'
      )
    },
  }
}
