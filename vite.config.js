import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const STAGING = 'https://staging.setuai.com'

/** Proxy SETU service prefixes to staging (mirrors RN .env bases). */
function stagingProxy(pathPrefix) {
  return {
    [pathPrefix]: {
      target: STAGING,
      changeOrigin: true,
      secure: true,
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      ...stagingProxy('/auth'),
      ...stagingProxy('/dashboard'),
      ...stagingProxy('/sos'),
      ...stagingProxy('/booktest'),
      ...stagingProxy('/abha'),
      ...stagingProxy('/drug'),
      ...stagingProxy('/telemedicine'),
      ...stagingProxy('/generic'),
      ...stagingProxy('/mental'),
      ...stagingProxy('/agri'),
      ...stagingProxy('/schemes'),
      ...stagingProxy('/fitness'),
      // Payment verify + fee breakdown (telemedicine / book-test flows)
      ...stagingProxy('/pay'),
      ...stagingProxy('/amount-breakdown'),
      // Only proxy the remote storage API — not `/assets/*` static files from public/
      // (dashboard icons, welcome art, marketing images live in public/assets/).
      ...stagingProxy('/assets/api'),
      ...stagingProxy('/jobs'),
      ...stagingProxy('/notification'),
      ...stagingProxy('/userprofile'),
      ...stagingProxy('/preventive-health'),
      ...stagingProxy('/reports'),
      ...stagingProxy('/healthcard'),
      ...stagingProxy('/phr'),
      ...stagingProxy('/matrujyoti'),
      ...stagingProxy('/temple'),
      ...stagingProxy('/language'),
    },
  },
})
