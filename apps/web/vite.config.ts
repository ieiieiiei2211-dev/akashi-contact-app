import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/',
  plugins: [react()],`n  preview: {`n    allowedHosts: true`n  },
})
