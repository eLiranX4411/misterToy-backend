import fs from 'fs'
import path from 'path'
import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'

import { loggerService } from './services/logger.service.js'
import { toyService } from './services/toy.service.js'
import { utilService } from './services/util.service.js'
// import { userService } from './services/user.service.js'

const app = express()

app.use(express.static('public'))
app.use(cookieParser())
app.use(express.json())

const corsOptions = {
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://127.0.0.1:5174'],
  credentials: true
}

app.use(cors(corsOptions))

// Toys Routes------------------------------------

// GET

app.get('/api/toy', (req, res) => {
  const filterBy = {
    name: req.query.name || '',
    price: req.query.price || 0,
    inStock: req.query.inStock,
    pageIdx: +req.query.pageIdx || 0,
    labels: req.query.labels ? req.query.labels.split(',') : []
  }

  const sortBy = {
    createdAt: +req.query.createdAt || 0,
    price: req.query.price || 0,
    sortDir: +req.query.sortDir || 0
  }

  toyService
    .query(filterBy, sortBy)
    .then((toys) => res.send(toys))
    .catch((err) => {
      loggerService.error(err)
      res.status(400).send('Problem Getting Bugs', err)
    })
})

// POST

app.post('/api/toy', (req, res) => {
  const user = userService.validateToken(req.cookies.loginToken)
  console.log('Cookies:', req.cookies)

  // if (!user) {
  //   return res.status(401).send('Unauthenticated: Please log in to add a toy')
  // }

  const toyToSave = {
    name: req.body.name || '',
    price: req.query.price || 0,
    inStock: req.query.inStock,
    labels: req.body.labels || [],
    createdAt: +req.body.createdAt || 0
    // creator: req.body.creator
  }

  toyService
    .save(toyToSave, user)
    .then((savedToy) => res.send(savedToy))
    .catch((err) => {
      loggerService.error('Cannot add toy', err)
      res.status(400).send('Cannot add toy', err)
    })
})

// PUT

app.put('/api/toy/:toyId', (req, res) => {
  // const user = userService.validateToken(req.cookies.loginToken)

  // if (!user) {
  //   return res.status(401).send({ error: 'Unauthenticated: Please log in' })
  // }

  const toyToSave = {
    _id: req.params.toyId,
    name: req.body.name || '',
    price: req.query.price || 0,
    inStock: req.query.inStock,
    createdAt: +req.body.createdAt || 0,
    labels: req.body.labels || []
    // creator: req.body.creator || {}
  }

  toyService
    .save(toyToSave, user)
    .then((savedToy) => res.send(savedToy))
    .catch((err) => {
      loggerService.error('Cannot edit toy', err)
      res.status(400).send({ error: 'Cannot edit toy', details: err })
    })
})

// GET & ID
app.get('/api/toy/:toyId', visitedToys, (req, res) => {
  const { toyId } = req.params

  toyService
    .getById(toyId)
    .then((toy) => res.send(toy))
    .catch((err) => {
      loggerService.error(err)
      res.status(400).send(err)
    })
})

// DELETE

app.delete('/api/toy/:toyId', (req, res) => {
  const user = userService.validateToken(req.cookies.loginToken)
  const { toyId } = req.params

  toyService
    .remove(toyId, user)
    .then((toy) => res.send(toy))
    .catch((err) => {
      loggerService.error(err)
      res.status(400).send(err)
    })
})

// LOGS
app.get('/api/logs', (req, res) => {
  const path = process.cwd()
  res.sendFile(path + '/logs/backend.log')
})

// COOKIES VISIT BUGS MIDDLEWARE FUNCTION
function visitedToys(req, res, next) {
  const { toyId } = req.params

  let visitedToys = req.cookies.visitedToys || []

  if (!visitedToys.includes(toyId)) {
    visitedToys.push(toyId)
  }

  if (visitedToys.length > 3) {
    loggerService.error(`User visit more then 3 toys ${visitedToys} `)
    return res.status(401).send('Wait for a bit...')
  }
  res.cookie('visitedToys', visitedToys, { maxAge: 7000 })
  console.log(`User visited the following toys: [${visitedToys}]`)

  next()
}

/*
User Routes ------------------------------------

USER GET

app.get('/api/user', (req, res) => {
  userService
    .query()
    .then((users) => res.send(users))
    .catch((err) => {
      loggerService.error('Cannot load users', err)
      res.status(400).send('Cannot load users')
    })
})

// USER GET & ID

app.get('/api/user/:userId', (req, res) => {
  const { userId } = req.params

  userService
    .getById(userId)
    .then((user) => res.send(user))
    .catch((err) => {
      loggerService.error('Cannot load user', err)
      res.status(400).send('Cannot load user')
    })
})

// USER DELETE & ID

app.delete('/api/user/:userId', (req, res) => {
  const { userId } = req.params

  userService
    .remove(userId)
    .then((user) => {
      res.clearCookie('loginToken')
      res.send(user)
    })
    .catch((err) => {
      loggerService.error('Cannot remove user', err)
      res.status(400).send('Cannot remove user', err)
    })
})

// User Auth Routes ------------------------------------

// USER POST SIGNUP

app.post('/api/auth/signup', (req, res) => {
  const credentials = {
    username: req.body.username || '',
    password: req.body.password,
    fullname: req.body.fullname || ''
  }

  userService.save(credentials).then((userCredentials) => {
    if (userCredentials) {
      const loginToken = userService.getLoginToken(userCredentials)
      res.cookie('loginToken', loginToken)
      res.send(userCredentials)
    } else {
      loggerService.error('Cannot signup a user')
      res.status(400).send('Cannot signup a user')
    }
  })
})

// USER POST LOGIN

app.post('/api/auth/login', (req, res) => {
  const credentials = {
    username: req.body.username || '',
    password: req.body.password
  }

  userService.checkLogin(credentials).then((userCredentials) => {
    if (userCredentials) {
      const loginToken = userService.getLoginToken(userCredentials)
      res.cookie('loginToken', loginToken)
      res.send(userCredentials)
    } else {
      loggerService.error('User Cannot login ')
      res.status(400).send('User cannot login ')
    }
  })
})

// USER POST LOGOUT

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('loginToken')
  res.send('logged-out!')
})

// SERVER PORT LISTENER

// Fallback route
app.get('/**', (req, res) => {
  res.sendFile(path.resolve('public/index.html'))
})

const PORT = process.env.PORT || 3030
app.listen(PORT, () => loggerService.info(`Server listening on port http://127.0.0.1:${PORT}/`))

*/
