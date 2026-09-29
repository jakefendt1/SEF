import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // The suite is deliberately node-only: it proves logic, not that the screen
  // works. The React plugin and the `@` alias are here for the one exception --
  // a server-render smoke test that proves a page still mounts at all.
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
  },
})
