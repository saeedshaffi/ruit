import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Relative base so the build can be hosted from any path (GitHub Pages, artifact preview).
export default defineConfig({ base: './', plugins: [react()] })
