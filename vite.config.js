import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Local Vite proxy target.
 * Default: staging — production api.setuai.com/auth currently returns nginx 502.
 * Override: VITE_PROXY_API_HOST=https://api.setuai.com or http://localhost:7005
 */
const DEFAULT_API_HOST = 'https://staging.setuai.com'

/** Proxy SETU service prefixes to the API host (mirrors RN .env bases). */
function apiProxy(pathPrefix, apiHost) {
  return {
    [pathPrefix]: {
      target: apiHost,
      changeOrigin: true,
      secure: true,
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiHost = (env.VITE_PROXY_API_HOST || DEFAULT_API_HOST).replace(/\/+$/, '')

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
        ...apiProxy('/auth', apiHost),
        ...apiProxy('/dashboard', apiHost),
        ...apiProxy('/sos', apiHost),
        ...apiProxy('/booktest', apiHost),
        ...apiProxy('/abha', apiHost),
        ...apiProxy('/drug', apiHost),
        ...apiProxy('/telemedicine', apiHost),
        ...apiProxy('/generic', apiHost),
        ...apiProxy('/mental', apiHost),
        ...apiProxy('/agri', apiHost),
        ...apiProxy('/schemes', apiHost),
        ...apiProxy('/fitness', apiHost),
        // Payment verify + fee breakdown (telemedicine / book-test flows)
        ...apiProxy('/pay', apiHost),
        ...apiProxy('/amount-breakdown', apiHost),
        // Only proxy the remote storage API — not `/assets/*` static files from public/
        // (dashboard icons, welcome art, marketing images live in public/assets/).
        ...apiProxy('/assets/api', apiHost),
        ...apiProxy('/jobs', apiHost),
        ...apiProxy('/notification', apiHost),
        ...apiProxy('/userprofile', apiHost),
        ...apiProxy('/preventive-health', apiHost),
        ...apiProxy('/reports', apiHost),
        ...apiProxy('/healthcard', apiHost),
        ...apiProxy('/phr', apiHost),
        ...apiProxy('/matrujyoti', apiHost),
        ...apiProxy('/temple', apiHost),
        ...apiProxy('/language', apiHost),
      },
    },
  }
})
