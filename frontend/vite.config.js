import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
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
        target: 'http://localhost:3002',
        changeOrigin: true
      },
      // Individual explicit proxies for common printer asset paths
      '/assets': { target: 'http://localhost:3002', changeOrigin: true },
      '/js': { target: 'http://localhost:3002', changeOrigin: true },
      '/css': { target: 'http://localhost:3002', changeOrigin: true },
      '/img': { target: 'http://localhost:3002', changeOrigin: true },
      '/fonts': { target: 'http://localhost:3002', changeOrigin: true },
      '/octoapp': { target: 'http://localhost:3002', changeOrigin: true },
      '/printer': { target: 'http://localhost:3002', changeOrigin: true }
    }
  }
})
