import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: './postcss.config.js',
  },
  server: {
    port: 3200,
    host: true, // 네트워크 접속 허용하려면 true나 '0.0.0.0' 넣기
  },
})
