import { ObjectId } from 'mongodb'

import { asyncLocalStorage } from '../../services/als.service.js'
import { logger } from '../../services/logger.service.js'
import { dbService } from '../../services/db.service.js'

export const reviewService = { query, remove, add }

async function query(filterBy = {}) {
  try {
    const criteria = _buildCriteria(filterBy)
    const collection = await dbService.getCollection('review')

    var reviews = await collection
      .aggregate([
        {
          $match: criteria
        },
        {
          $lookup: {
            localField: 'byUserId',
            from: 'user',
            foreignField: '_id',
            as: 'byUser'
          }
        },
        {
          $unwind: '$byUser'
        },
        {
          $lookup: {
            localField: 'aboutToyId',
            from: 'toy',
            foreignField: '_id',
            as: 'aboutToy'
          }
        },
        {
          $unwind: '$aboutToy'
        },
        {
          $project: {
            txt: true,
            'byUser._id': true,
            'byUser.fullname': true,
            'aboutToy._id': true,
            'aboutToy.fullname': true
          }
        }
      ])
      .toArray()

    return reviews
  } catch (err) {
    logger.error('cannot get reviews', err)
    throw err
  }
}

async function remove(reviewId) {
  try {
    const { loggedinUser } = asyncLocalStorage.getStore()
    const collection = await dbService.getCollection('review')

    const criteria = { _id: ObjectId.createFromHexString(reviewId) }

    // remove only if user is owner/admin
    if (!loggedinUser.isAdmin) {
      criteria.byUserId = ObjectId.createFromHexString(loggedinUser._id)
    }

    const { deletedCount } = await collection.deleteOne(criteria)
    return deletedCount
  } catch (err) {
    logger.error(`cannot remove review ${reviewId}`, err)
    throw err
  }
}

async function add(review) {
  try {
    const reviewToAdd = {
      byUserId: ObjectId.createFromHexString(review.byUserId),
      aboutToyId: ObjectId.createFromHexString(review.aboutToyId),
      txt: review.txt
    }
    const collection = await dbService.getCollection('review')
    await collection.insertOne(reviewToAdd)

    return reviewToAdd
  } catch (err) {
    logger.error('cannot add review', err)
    throw err
  }
}

function _buildCriteria(filterBy) {
  const criteria = {}

  if (filterBy.byUserId) {
    criteria.byUserId = ObjectId.createFromHexString(filterBy.byUserId)
  }
  return criteria
}
