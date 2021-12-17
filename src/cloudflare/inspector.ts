import { CfPreviewToken } from 'wrangler/src/api/preview'
import { DtInspector } from 'wrangler/src/api/inspect'

export function useInspector(token: CfPreviewToken, onError: (e: any) => void) {
  const inspector = new DtInspector(token.inspectorUrl.toString(), onError)
  const abortController = inspector.proxyTo(9229)
  return {
    close() {
      inspector.close()
      abortController.abort()
    },
  }
}
