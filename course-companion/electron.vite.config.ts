import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      lib: {
        entry: 'electron/main/index.ts'
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      lib: {
        entry: 'electron/preload/index.ts'
      },
      rollupOptions: {
        output: {
          entryFileNames: 'index.js',
          format: 'cjs'
        }
      }
    }
  },
  renderer: {
    root: 'src/renderer',
    plugins: [react()]
  }
})
