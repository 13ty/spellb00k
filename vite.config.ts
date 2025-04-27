import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['@sqlite.org/sqlite-wasm'], // Keep excluding wasm pkg if it causes issues
  },
  server: {
    headers: {
      // Required for SharedArrayBuffer, which sql.js might use internally or in workers
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  // Ensure .wasm files are served with the correct MIME type
  // Vite usually handles this correctly for files in `public`, but explicit config can help.
  // We'll rely on Vite's default handling first, combined with `locateFile`.
  // If issues persist, we might need `vite-plugin-wasm` or similar.
  appType: 'spa',
})
