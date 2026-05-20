import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { notesPlugin } from './vite-notes-plugin'

export default defineConfig({
  plugins: [react(), notesPlugin()],
  server: {
    port: 3000,
    open: true
  },
  test: {
    environment: 'jsdom',
    globals: true
  }
})
