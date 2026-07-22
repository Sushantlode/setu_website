import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Local Vite proxy target.
 * Default: staging — production api.setuai.com/auth currently returns nginx 502.
 * Override: VITE_PROXY_API_HOST=https://api.setuai.com
 * Auth-only local SETU-AUTH: VITE_PROXY_AUTH_HOST=http://localhost:7005
 */
const DEFAULT_API_HOST = 'https://staging.setuai.com'
/** Report/dashboard art lives on production storage (staging assets often 500). */
const DEFAULT_ASSETS_API_HOST = 'https://api.setuai.com'

function isLocalServiceHost(host) {
  return /localhost|127\.0\.0\.1|:7005\b/.test(host)
}

/** Proxy SETU service prefixes to the API host (mirrors RN .env bases). */
function apiProxy(pathPrefix, apiHost) {
  return {
    [pathPrefix]: {
      target: apiHost,
      changeOrigin: true,
      secure: !isLocalServiceHost(apiHost),
    },
  }
}

/**
 * /auth → SETU-AUTH. Staging gateway keeps /auth prefix; local SETU-AUTH (port 7005)
 * serves routes at / (e.g. /api/vle, /otp/send) so strip /auth when target is local.
 */
function authProxy(authHost) {
  const local = isLocalServiceHost(authHost)
  return {
    '/auth': {
      target: authHost,
      changeOrigin: true,
      secure: !local,
      rewrite: local ? (path) => path.replace(/^\/auth/, '') || '/' : undefined,
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiHost = (env.VITE_PROXY_API_HOST || DEFAULT_API_HOST).replace(/\/+$/, '')
  const authHost = (env.VITE_PROXY_AUTH_HOST || env.VITE_PROXY_API_HOST || DEFAULT_API_HOST).replace(
    /\/+$/,
    '',
  )
  const assetsHost = (env.VITE_ASSETS_API_HOST || DEFAULT_ASSETS_API_HOST).replace(
    /\/+$/,
    '',
  )

  if (mode === 'development' && isLocalServiceHost(authHost)) {
    console.info(`[vite] SETU-AUTH proxy → ${authHost} (strips /auth prefix)`)
  }

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'setu-html-asset-fixes',
        transformIndexHtml(html) {
          // crossorigin breaks CSS on some Apache/GoDaddy setups without CORS headers
          return html
            .replace(/\s+crossorigin/g, '')
            .replace(
              /(\/(?:assets\/[^"']+\.(?:css|js)|brand\/setu-(?:favicon|apple-touch-icon)[^"']*))(?:\?[^"']*)?"/g,
              '$1?v=20260718"',
            )
        },
      },
    ],
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
        ...authProxy(authHost),
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
        // Storage objects → production (staging /assets/api returns 500 for most keys).
        ...apiProxy('/assets/api', assetsHost),
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
