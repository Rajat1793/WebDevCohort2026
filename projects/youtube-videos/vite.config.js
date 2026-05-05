import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/WebDevCohort2026/projects/youtube-videos/',
  plugins: [react()],
})
