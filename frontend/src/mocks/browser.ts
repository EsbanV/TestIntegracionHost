import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

// This configures a Service Worker with the given request handlers.
export const worker = setupWorker(...handlers)

// Start the Service Worker.
worker.start({
  onUnhandledRequest: ({ url, method }) => {
    const parsedUrl = new URL(url)
    if (parsedUrl.protocol === 'ws:' || parsedUrl.hostname === 'accounts.google.com' || parsedUrl.hostname === 'via.placeholder.com') {
      return
    }
    console.warn(`[MSW] Unhandled ${method} ${url}`)
  },
})
