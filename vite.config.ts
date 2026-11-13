import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base './' makes the built app work from any folder or host (Vercel, a claude.ai link, etc.)
export default defineConfig({
  base: './',
  plugins: [react()],
})
