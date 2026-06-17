import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const useHttps = mode === 'https'

  return {
    plugins: [react(), ...(useHttps ? [mkcert()] : [])],
    server: {
      host: true,
      port: 5173,
      https: useHttps,
      proxy: {
        '/ws': {
          target: 'http://127.0.0.1:8000',
          ws: true,
          changeOrigin: true,
        },
      },
    },
  }
})
