import express from 'express'
import documentRoutes from './routes/documents.js'

const app = express()

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/documents', documentRoutes)

export default app
