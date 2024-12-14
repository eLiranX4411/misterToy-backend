import { ObjectId } from 'mongodb'
import { dbService } from '../../services/db.service.js'

export const toyService = {
  query,
  get,
  remove,
  save,
  addToyMsg,
  removeToyMsg
}

async function query(filterBy = {}) {
  try {
    const criteria = _buildCriteria(filterBy)
    const sortOptions = _buildSortOptions(filterBy)
    const { pageIdx = 0, pageSize = 4 } = filterBy

    const collection = await dbService.getCollection('toy')

    // Perform the query with criteria, sorting, and pagination
    const toys = await collection
      .find(criteria)
      .sort(sortOptions)
      .skip(pageIdx * pageSize) // Skip documents for pagination
      .limit(pageSize) // Limit number of documents
      .toArray()

    console.log(`Service:`, toys)
    return toys
  } catch (err) {
    logger.error('Cannot query toys', err)
    throw new Error(`Can't get toys...`)
  }
}

async function get(toyId) {
  try {
    const collection = await dbService.getCollection('toy')
    const toy = await collection.findOne({ _id: ObjectId.createFromHexString(toyId) })
    toy.createdAt = toy._id.getTimestamp()
    return toy
  } catch (err) {
    logger.error('Cannot get toy', err)
    throw new Error(`Can't get toy...`)
  }
}

async function remove(toyId) {
  try {
    const collection = await dbService.getCollection('toy')
    const toy = await collection.deleteOne({ _id: ObjectId.createFromHexString(toyId) })
    return toy
  } catch (err) {
    logger.error('Cannot get toy', err)
    throw new Error(`Can't get toy...`)
  }
}

async function save(toy) {
  try {
    const collection = await dbService.getCollection('toy')

    if (toy._id) {
      const toyId = ObjectId(toy._id) // Convert string to ObjectId
      const toyToUpdate = {
        name: toy.name,
        price: toy.price,
        inStock: toy.inStock,
        labels: toy.labels,
        updatedAt: Date.now()
      }

      const updatedToy = await collection.updateOne({ _id: toyId }, { $set: toyToUpdate })

      if (updatedToy.matchedCount === 0) {
        throw new Error('Toy not found for update')
      }

      return { ...toy, updatedAt: toyToUpdate.updatedAt } // Return updated toy with timestamp
    } else {
      // Insert new toy
      const toyToInsert = {
        name: toy.name,
        price: toy.price,
        inStock: toy.inStock || false,
        labels: toy.labels || [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      }

      const insertedToy = await collection.insertOne(toyToInsert)

      return { ...toyToInsert, _id: insertedToy.insertedId } // Include the generated _id
    }
  } catch (err) {
    logger.error('Cannot save toy', err)
    throw new Error(`Can't save toy...`)
  }
}

async function addToyMsg(toyId, msg) {
  try {
    msg.id = _makeId()

    const collection = await dbService.getCollection('toy')
    await collection.updateOne(
      { _id: ObjectId.createFromHexString(toyId) },
      { $push: { msgs: msg } }
    )
    return msg
  } catch (err) {
    logger.error(`cannot add car msg ${toyId}`, err)
    throw err
  }
}

async function removeToyMsg(toyId, msgId) {
  try {
    const collection = await dbService.getCollection('toy')
    await collection.updateOne(
      { _id: ObjectId.createFromHexString(toyId) },
      { $pull: { msgs: { id: msgId } } }
    )
    return msgId
  } catch (err) {
    logger.error(`cannot add car msg ${toyId}`, err)
    throw err
  }
}

// -------------------------------Utils--------------------------------

function _makeId(length = 5) {
  let text = ''
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return text
}

// Helper to construct the filtering criteria
function _buildCriteria(filterBy) {
  const criteria = {}
  if (filterBy.name) {
    criteria.name = { $regex: filterBy.name, $options: 'i' }
  }
  if (filterBy.inStock !== undefined) {
    criteria.inStock = JSON.parse(filterBy.inStock) // Ensure boolean conversion
  }
  if (filterBy.labels && filterBy.labels.length) {
    criteria.labels = { $in: filterBy.labels } // Match any label in the array
  }
  return criteria
}

// Helper to construct the sorting options
function _buildSortOptions(filterBy) {
  if (!filterBy.sortBy || !filterBy.sortBy.type) return {} // No sorting if not specified

  const sortDirection = filterBy.sortBy.desc ? -1 : 1
  return { [filterBy.sortBy.type]: sortDirection }
}
