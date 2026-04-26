import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({`n  preview: { allowedHosts: true },
  base: '/',
  plugins: [react()],`n  preview: {`n    allowedHosts: true`n  },
})

