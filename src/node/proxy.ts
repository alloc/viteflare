/**
 * Copied from https://github.com/cloudflare/wrangler2/blob/040c27fe45e295f2ceba846e468c336ab92e9f62/packages/wrangler/src/dev.tsx#L488
 */
import httpProxy from 'http-proxy'
import http from 'http'
import { CfPreviewToken } from 'wrangler/src/api/preview'
import kleur from 'kleur'

export function useProxy(
  token: CfPreviewToken,
  port: number,
  onError: (error: Error) => void
) {
  const proxy = httpProxy.createProxyServer({
    secure: false,
    changeOrigin: true,
    headers: {
      'cf-workers-preview-token': token.value,
    },
    target: `https://${token.host}`,
    // TODO: log websockets too? validate durables, etc
  })

  const server = http
    .createServer((req, res) => {
      proxy.web(req, res)
    })
    .on('error', onError)
    .listen(port)

  proxy.on('error', onError)
  proxy.on('proxyRes', function (proxyRes, req, res) {
    // log all requests
    console.log(
      kleur.gray(new Date().toLocaleTimeString()),
      req.method,
      req.url,
      res.statusCode // TODO add a status message like Ok etc?
    )
  })

  return {
    close() {
      proxy.close()
      server.close()
    },
  }
}
