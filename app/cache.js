const { cache: config } = require('./config')
const { createClient } = require('redis')
const hoek = require('@hapi/hoek')
let client

const start = async () => {
  client = createClient({ socket: config.socket, password: config.password })
  client.on('error', (err) => console.log(`Redis error: ${err}`))
  client.on('reconnecting', () => console.log('Redis reconnecting...'))
  client.on('ready', () => console.log('Redis connected'))
  await client.connect()
}

const stop = async () => {
  await client.disconnect()
}

const get = async (cache, key) => {
  const fullKey = getFullKey(cache, key)
  const value = await client.get(fullKey)
  return value ? JSON.parse(value) : {}
}

const set = async (cache, key, value) => {
  const fullKey = getFullKey(cache, key)
  const serializedValue = JSON.stringify(value)
  await client.set(fullKey, serializedValue, { EX: config.ttl })
}

const update = async (cache, key, cacheData) => {
  const existing = await get(cache, key)
  hoek.merge(existing, cacheData, { mergeArrays: true })
  await set(cache, key, existing)
}

const getFullKey = (cache, key) => {
  const prefix = getKeyPrefix(cache)
  return `${prefix}:${key}`
}

const getKeyPrefix = (cache) => {
  return `${config.partition}:${cache}`
}

module.exports = {
  start,
  stop,
  set,
  update
}
