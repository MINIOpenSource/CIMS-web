import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import alias from "@rollup/plugin-alias"
import resolve from "@rollup/plugin-node-resolve"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    alias(),
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    rollupOptions: {
      plugins: [
          resolve()
      ]
    }
  }
})
