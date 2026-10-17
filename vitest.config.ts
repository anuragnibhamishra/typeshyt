import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    restoreMocks: true,
    clearMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: ['src/App.tsx', 'src/components/**/*.tsx', 'src/hooks/**/*.ts', 'src/utils/**/*.ts'],
      exclude: ['src/components/Header.tsx'],
    },
  },
})
