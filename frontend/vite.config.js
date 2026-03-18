import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Load HOST_IP from root .env if available
  const hostIp = env.HOST_IP || 'localhost'
  const apiUrl = env.VITE_API_URL || `http://${hostIp}:3002`
  return {
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: apiUrl,
        changeOrigin: true
      },
      // Individual explicit proxies for common printer asset paths
      '/assets': { target: apiUrl, changeOrigin: true },
      '/js': { target: apiUrl, changeOrigin: true },
      '/css': { target: apiUrl, changeOrigin: true },
      '/img': { target: apiUrl, changeOrigin: true },
      '/fonts': { target: apiUrl, changeOrigin: true },
      '/octoapp': { target: apiUrl, changeOrigin: true },
      '/printer': { target: apiUrl, changeOrigin: true }
    }
  }
  }
})
