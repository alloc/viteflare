# viteflare

[![npm](https://img.shields.io/npm/v/viteflare.svg)](https://www.npmjs.com/package/viteflare)
[![Code style: Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://paypal.me/alecdotbiz)

**ViteFlare** is a thin wrapper around Cloudflare Wrangler **v2** (which is in beta), and it brings the flexibility of Vite-powered plugins (and Vite's vibrant plugin ecosystem) to Cloudflare workers.

### Develop your worker

```sh
# In your worker's directory:
viteflare

# or pass a relative path:
viteflare path/to/worker/directory
```

This runs your worker **remotely**. By default, your worker listens to port 8787, but you can use `--port 1234` to change that. Currently, running multiple workers at once is not supported.

#### Debugging

Press `d` in the terminal while `viteflare` is running. This opens up Chrome devtools for your worker. The devtools will refresh whenever your worker is re-bundled.

### Publish your worker

```sh
# In your worker's directory:
viteflare publish

# or pass a relative path:
viteflare publish path/to/worker/directory
```
