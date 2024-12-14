import { logger } from '../../services/logger.service.js'
import { toyService } from './toy.service.js'

export async function getToys(req, res) {
  const { name, inStock = null, pageIdx, sortBy, labels = [] } = req.query

  try {
    const filterBy = { name, inStock, pageIdx: +pageIdx, sortBy, labels }
    const toys = await toyService.query(filterBy)
    console.log(`Controller:`, toys)
    res.send(toys)
  } catch (err) {
    logger.error('Cannot load toys', err)
    res.status(500).send('Cannot load toys')
  }
}

export async function getToyById(req, res) {
  const { toyId } = req.params

  try {
    const toy = await toyService.get(toyId)
    res.send(toy)
  } catch (err) {
    logger.error('Cannot get toy', err)
    res.status(500).send('Cannot retrieve toy')
  }
}

export async function addToy(req, res) {
  const { loggedinUser } = req
  const { name, price, labels } = req.body

  try {
    const toy = {
      name,
      price: +price,
      labels
    }

    toy.owner = loggedinUser
    const toyToSave = await toyService.save(toy)
    res.send(toyToSave)
  } catch (err) {
    logger.error('Cannot add toy', err)
    res.status(500).send('Cannot add toy')
  }
}

export async function updateToy(req, res) {
  const { name, price, _id, labels } = req.body

  try {
    const toy = {
      _id,
      name,
      price: +price,
      labels
    }

    const toyToSave = await toyService.save(toy)
    res.send(toyToSave)
  } catch (err) {
    logger.error('Cannot update toy', err)
    res.status(500).send('Cannot update toy')
  }
}

export async function removeToy(req, res) {
  const { toyId } = req.params

  try {
    const toyToRemove = await toyService.remove(toyId)
    res.send(toyToRemove)
  } catch (err) {
    logger.error('Cannot delete toy', err)
    res.status(500).send('Cannot delete toy, ' + err)
  }
}

export async function addToyMsg(req, res) {
  const { loggedinUser } = req
  try {
    const toyId = req.params.id
    const msg = {
      txt: req.body.txt,
      by: loggedinUser,
      createdAt: Date.now()
    }
    const savedMsg = await toyService.addToyMsg(toyId, msg)
    res.json(savedMsg)
  } catch (err) {
    logger.error('Failed to update car', err)
    res.status(500).send({ err: 'Failed to update car' })
  }
}

export async function removeToyMsg(req, res) {
  const { id: toyId, msgId } = req.params
  try {
    const removedId = await toyService.removeToyMsg(toyId, msgId)
    res.send(removedId)
  } catch (err) {
    logger.error('Failed to remove car msg', err)
    res.status(500).send({ err: 'Failed to remove car msg' })
  }
}
