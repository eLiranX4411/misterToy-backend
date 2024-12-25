import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'
import http from 'http'

import { setupAsyncLocalStorage } from './middlewares/setupAls.middleware.js'
import { setupSocketAPI } from './services/socket.service.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

import { logger } from './services/logger.service.js'
logger.info('server.js loaded...')

const app = express()
const server = http.createServer(app)

// Express App Config
app.use(cookieParser())
app.use(express.json())
app.use(express.static('public'))

if (process.env.NODE_ENV === 'production') {
  // Express serve static files on production environment
  app.use(express.static(path.resolve(__dirname, 'public')))
  console.log('__dirname: ', __dirname)
} else {
  // Configuring CORS
  // Make sure origin contains the url
  // your frontend dev-server is running on
  const corsOptions = {
    origin: [
      'http://127.0.0.1:5173',
      'http://localhost:5173',

      'http://127.0.0.1:3000',
      'http://localhost:3000'
    ],
    credentials: true
  }
  app.use(cors(corsOptions))
}

import { authRoutes } from './api/auth/auth.routes.js'
import { userRoutes } from './api/user/user.routes.js'
import { reviewRoutes } from './api/review/review.routes.js'
import { toyRoutes } from './api/toy/toy.routes.js'

// Routes
app.all('*', setupAsyncLocalStorage)

app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/review', reviewRoutes)
app.use('/api/toy', toyRoutes)

setupSocketAPI(server)

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
        logger.info(`Server listening on port http://127.0.0.1:${port}/`)
        resolve(server)
      })
    })
  } catch (err) {
    logger.error('Failed to start the server', err)
    process.exit(1) // Exit the process on failure
  }
}

// Call the async function to start the server
startServer()
