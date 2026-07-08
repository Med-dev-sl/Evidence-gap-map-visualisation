import express from 'express'
import documentRoutes from './routes/documents.js'

const app = express()

app.use(express.json())
app.use('/api/documents', documentRoutes)

export default app

export function startServer(port = 3001) {
  return app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`)
  })
}
