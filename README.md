# viteflare

[![npm](https://img.shields.io/npm/v/viteflare.svg)](https://www.npmjs.com/package/viteflare)
[![Code style: Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://paypal.me/alecdotbiz)

**ViteFlare** is a thin wrapper around Cloudflare Wrangler **v2** (which is in beta), and it brings the flexibility of Vite-powered plugins (and Vite's vibrant plugin ecosystem) to Cloudflare workers.

&nbsp;

**What does this do?**  
Along with freeing your Cloudflare workers from being either contained in one file or bundled with Webpack, it allows your workers to be transformed using Vite plugins before they're deployed. It also provides a remote dev environment that exactly reproduces how Cloudflare workers operate in production.

**What does this not do?**  
It does _not_ run Vite within your worker.

&nbsp;

### Quick Start

Clone this template: [alloc/viteflare-template](https://github.com/alloc/viteflare-template)

Use `degit` for a blazing fast setup locally:

```sh
npx degit https://github.com/alloc/viteflare-template my-worker
```

### Manual Setup

```sh
pnpm install viteflare vite -D
```

Each worker needs its own directory that contains a `package.json` and `wrangler.toml` file. Optionally, it can also contain a `vite.config.js` file. The `main` field in its `package.json` should point to a module that exports a Cloudflare worker.

```ts
// Example worker module
import { defineWorker } from 'viteflare'

export default defineWorker({
  fetch(request, bindings, context) {
    return Promise.resolve(new Response('hello world'))
  },
})
```

&nbsp;

### Develop your worker

```sh
# In your worker's directory:
pnpm viteflare

# or pass a relative path:
pnpm viteflare path/to/worker/directory
```

Note: You might use `yarn viteflare` instead, if you prefer.

This runs your worker **remotely**. By default, your worker listens to port 8787, but you can use `--port 1234` to change that. Currently, running multiple workers at once is not supported.

#### Debugging

Press `d` in the terminal while `viteflare` is running. This opens up Chrome devtools for your worker. The devtools will refresh whenever your worker is re-bundled.

&nbsp;

### Publish your worker

```sh
# In your worker's directory:
pnpm viteflare publish

# or pass a relative path:
pnpm viteflare publish path/to/worker/directory
```
