import { defineConfig } from 'vite'
import { nextAppRouter } from 'vite-plugin-next-app-router'
import react from '@vitejs/plugin-react-swc'
import inspect from 'vite-plugin-inspect'

export default defineConfig({
  plugins: [react(), nextAppRouter(), inspect({
      build: true,
    })],
})
