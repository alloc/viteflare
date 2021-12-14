import http from 'http'

export type DevToolsRefresh = http.Server & {
  bundleId: number
}

export function useDevToolsRefresh() {
  // TODO: this is a hack while we figure out
  // a better cleaner solution to get devtools to reconnect
  // without having to do a full refresh
  const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Request-Method', '*')
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET')
    res.setHeader('Access-Control-Allow-Headers', '*')
    if (req.method === 'OPTIONS') {
      res.writeHead(200)
      res.end()
      return
    }
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ value: server.bundleId }))
  }) as DevToolsRefresh

  server.bundleId = -1
  server.listen(3142)
  return server
}
