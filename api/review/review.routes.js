import express from 'express'

import { requireAuth } from '../../middlewares/requireAuth.middleware.js'
import { log } from '../../middlewares/logger.middleware.js'

import { addReview, getReviews, deleteReview } from './review.controller.js'

export const reviewRoutes = express.Router()
// const router = express.Router()
// export const reviewRoutes = router

reviewRoutes.get('/', log, getReviews)
reviewRoutes.post('/', log, requireAuth, addReview)
reviewRoutes.delete('/:id', requireAuth, deleteReview)
