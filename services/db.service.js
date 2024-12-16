import { MongoClient } from 'mongodb'
import { config } from '../config/index.js'

export const dbService = {
  getCollection
}

var dbConn = null

async function getCollection(collectionName) {
  try {
    const db = await _connect()
    const collection = await db.collection(collectionName)
    // console.log('Database Config:', config.dbURL, config.dbName)
    return collection
  } catch (err) {
    logger.error('Failed to get Mongo collection', err)
    throw err
  }
}

async function _connect() {
  if (dbConn) return dbConn
  try {
    // const client = await MongoClient.connect(config.dbURL, { useUnifiedTopology: true })
    const client = await MongoClient.connect(config.dbURL)
    const db = client.db(config.dbName)
    dbConn = db
    return db
  } catch (err) {
    logger.error('Cannot Connect to DB', err)
    throw err
  }
}

async function testConnection() {
  try {
    const client = await MongoClient.connect(config.dbURL)
    console.log('Connected to MongoDB')
    const db = client.db(config.dbName)
    console.log('Connected to Database:', db.databaseName)
    const toys = await db.collection('toys').find({}).toArray()
    console.log('Fetched Toys:', toys)
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err)
  }
}

testConnection()
