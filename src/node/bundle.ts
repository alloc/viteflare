import * as esbuild from 'esbuild'
import EventEmitter from 'events'
import { mkdir, readJsonSync, watch, writeFile } from 'fs-extra'
import kleur from 'kleur'
import { clear, warn } from 'misty'
import path from 'path'
import * as terser from 'terser'
import { createServer, Plugin, ViteDevServer } from 'vite'
import { log } from '../log'

export const cacheDir = 'node_modules/.viteflare'

export interface Bundle {
  on(event: 'bundle', cb: (bundle: string) => void): void
  close(): void
}

export async function createBundle(
  root: string,
  mode: string,
  minify?: boolean
): Promise<Bundle> {
  let server: ViteDevServer
  try {
    clear()
    server = await createServer({
      root,
      mode,
      server: {
        middlewareMode: 'ssr',
        hmr: false,
      },
      plugins: [resolveMain],
    })
  } catch (e: any) {
    if (e.errors?.length) {
      return new Promise(resolve => {
        const { file } = e.errors[0].location
        const watcher = watch(file, {}, () => {
          watcher.close()
          resolve(createBundle(root, mode))
        })
      })
    }
    throw e
  }

  const moduleLoader: esbuild.Plugin = {
    name: 'viteflare:esbuild-resolve',
    setup(build) {
      build.onResolve({ filter: /.+/ }, file => {
        return { path: file.path, namespace: 'vite' }
      })
      build.onLoad({ filter: /.+/ }, async file => {
        const result = await server.transformRequest(file.path)
        if (result)
          return {
            loader: 'jsx',
            contents: result.code,
            resolveDir: file.path.startsWith(`/@fs/`)
              ? path.dirname(file.path.slice(5))
              : root,
          }
      })
    },
  }

  const emitter = new EventEmitter()

  async function build() {
    const main = server.config.build.ssr as string
    const mainUrl = '/' + path.relative(server.config.root, main)

    let built: esbuild.BuildResult & { outputFiles: esbuild.OutputFile[] }
    try {
      built = await esbuild.build({
        format: 'esm',
        entryPoints: [mainUrl],
        // treeShaking: true,
        sourcemap: 'inline',
        bundle: true,
        write: false,
        plugins: [moduleLoader],
      })
    } catch (e) {
      return
    }

    for (const warning of built.warnings) {
      warn(warning.text)
    }

    let code = built.outputFiles[0].text

    if (minify) {
      const minified = await terser.minify(code, {
        module: true,
        mangle: false,
        keep_fnames: true,
        keep_classnames: true,
        sourceMap: { url: 'inline' },
      })
      if (minified.code) {
        code = minified.code
      }
    }

    const bundlePath = path.join(root, cacheDir, 'bundle.js')
    await mkdir(path.dirname(bundlePath), { recursive: true })
    await writeFile(bundlePath, code)
    log(
      `Saved to ${kleur.cyan(
        path.relative(process.cwd(), bundlePath)
      )} ${kleur.gray(new Date().toLocaleTimeString())}`
    )

    emitter.emit('bundle', code)
  }

  const buildSoon = debounce(build, 50)

  buildSoon()
  server.watcher.on('change', file => {
    if (server.moduleGraph.getModulesByFile(file)) {
      buildSoon()
    }
  })

  return {
    on: emitter.on.bind(emitter),
    close: server.close.bind(server),
  }
}

const resolveMain: Plugin = {
  name: 'viteflare:resolveMain',
  config: config => {
    const root = config.root!
    const build = config.build || {}

    const main =
      typeof build.ssr == 'string'
        ? build.ssr
        : readJsonSync(path.join(root, 'package.json')).main

    if (!main)
      throw Error(
        `Must define "build.ssr" in vite.config.js or "main" in package.json`
      )

    return {
      build: {
        ssr: path.resolve(root, main),
      },
    }
  },
}

function debounce(fn: () => any, ms: number) {
  let t: NodeJS.Timeout
  return () => {
    clearTimeout(t)
    t = setTimeout(() => {
      const result = fn()
      if (typeof result.catch == 'function') {
        result.catch(console.error)
      }
    }, ms)
  }
}
