import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react', '@sqlite.org/sqlite-wasm'], // Keep excluding wasm pkg
  },
  // Removed server.headers, build, worker sections
  appType: 'spa', // Keep SPA mode
})
