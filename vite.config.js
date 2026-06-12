import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Obrigatório: sql.js usa WASM e quebra se o Vite tentar otimizar o módulo
  optimizeDeps: { exclude: ['sql.js'] },
})
