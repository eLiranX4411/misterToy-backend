import path from 'path'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

import { loggerService } from './services/logger.service.js'
import { toyService } from './services/toy.service.js'

const app = express()

const corsOptions = {
  origin: [
    'http://127.0.0.1:8080',
    'http://localhost:8080',

    'http://localhost:5173',
    'http://127.0.0.1:5173',

    'http://localhost:5174',
    'http://127.0.0.1:5174'
  ],
  credentials: true
}
// App Configuration
app.use(express.static('public'))
app.use(cookieParser()) // for res.cookies
app.use(express.json()) // for req.body
app.use(cors(corsOptions))

// **************** Toys API ****************:
// GET toys
app.get('/api/toy', async (req, res) => {
  const { name, inStock = null, pageIdx, sortBy, labels = [] } = req.query
  const filterBy = { name, inStock, pageIdx: +pageIdx, sortBy, labels }

  // console.log(filterBy)

  try {
    const toys = await toyService.query(filterBy)
    res.send(toys)
  } catch (err) {
    loggerService.error('Cannot load toys', err)
    res.status(500).send('Cannot load toys')
  }
})

app.get('/api/toy/:toyId', async (req, res) => {
  const { toyId } = req.params

  try {
    const toy = await toyService.get(toyId)
    res.send(toy)
  } catch (err) {
    loggerService.error('Cannot get toy', err)
    res.status(500).send('Cannot retrieve toy')
  }
})

app.post('/api/toy', async (req, res) => {
  const { name, price, labels } = req.body
  const toy = {
    name,
    price: +price,
    labels
  }
  try {
    const toyToSave = await toyService.save(toy)
    res.send(toyToSave)
  } catch (err) {
    loggerService.error('Cannot add toy', err)
    res.status(500).send('Cannot add toy')
  }
})

app.put('/api/toy', async (req, res) => {
  const { name, price, _id, labels } = req.body
  const toy = {
    _id,
    name,
    price: +price,
    labels
  }
  try {
    const toyToSave = await toyService.save(toy)
    res.send(toyToSave)
  } catch (err) {
    loggerService.error('Cannot update toy', err)
    res.status(500).send('Cannot update toy')
  }
})

app.delete('/api/toy/:toyId', async (req, res) => {
  const { toyId } = req.params

  try {
    const toyToRemove = await toyService.remove(toyId)
    res.send(toyToRemove)
  } catch (err) {
    loggerService.error('Cannot delete toy', err)
    res.status(500).send('Cannot delete toy, ' + err)
  }
})

// Fallback
app.get('/**', async (req, res, next) => {
  try {
    await res.sendFile(path.resolve('public/index.html'))
  } catch (err) {
    next(err)
  }
})

// Listen will always be the last line in our server!
const startServer = async () => {
  const port = 3030
  try {
    await new Promise((resolve, reject) => {
      const server = app.listen(port, (err) => {
        if (err) return reject(err)
        loggerService.info(`Server listening on port http://127.0.0.1:${port}/`)
        resolve(server)
      })
    })
  } catch (err) {
    loggerService.error('Failed to start the server', err)
    process.exit(1) // Exit the process on failure
  }
}

// Call the async function to start the server
startServer()
