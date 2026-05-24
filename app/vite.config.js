import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { notesPlugin } from './vite-notes-plugin'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  plugins: [
    react(),
    notesPlugin(),
    {
      name: 'copy-server',
      closeBundle() {
        fs.copyFileSync(
          path.resolve(__dirname, 'server.js'),
          path.resolve(__dirname, 'dist', 'server.js')
        )
      }
    }
  ],
  server: {
    port: 3000,
    open: true
  },
  test: {
    environment: 'jsdom',
    globals: true
  }
})
