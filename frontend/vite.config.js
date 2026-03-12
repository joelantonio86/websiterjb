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
      '/api': {
        target: 'https://rjb-email-sender-215755766100.europe-west1.run.app',
        changeOrigin: true,
        secure: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
