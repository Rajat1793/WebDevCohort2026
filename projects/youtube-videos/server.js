import express from 'express'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const app = express()
const PORT = process.env.PORT || 3000
const __dirname = dirname(fileURLToPath(import.meta.url))

// Health check for Render
app.get('/health', (_req, res) => res.json({ status: 'ok' }))

// Serve the built Vite app
app.use(express.static(join(__dirname, 'dist')))

// SPA fallback — send index.html for any non-asset route
app.get('/{*path}', (_req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'))
})

app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
