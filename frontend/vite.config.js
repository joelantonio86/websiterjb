import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync } from 'fs'
import { join } from 'path'

// GitHub Pages: 404.html = index.html para SPA (refresh em rotas como /partituras funciona)
function copy404Plugin() {
  return {
    name: 'copy-404',
    closeBundle() {
      const dir = join(process.cwd(), 'dist')
      copyFileSync(join(dir, 'index.html'), join(dir, '404.html'))
      console.log('✓ 404.html criado para SPA routing')
    }
  }
}

export default defineConfig({
  plugins: [react(), copy404Plugin()],
  server: {
    port: 3000,
    proxy: {
      // Em localhost, se VITE_API_BASE estiver vazio, o proxy manda /api para o backend local.
      // Com VITE_API_BASE=http://127.0.0.1:8080 o axios fala direto com o backend (CORS já permite).
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8080',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
