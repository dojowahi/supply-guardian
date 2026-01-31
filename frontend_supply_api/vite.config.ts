import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/network': 'http://localhost:8000',
      '/shipments': 'http://localhost:8000',
      '/products': 'http://localhost:8000',
      '/actions': 'http://localhost:8000',
    }
  }
})
