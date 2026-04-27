import { createClient } from 'redis'
import hoek from '@hapi/hoek'
import config from './config.js'

const { cache: cacheConfig } = config
let client

const start = async () => {
  client = createClient({ socket: cacheConfig.socket, password: cacheConfig.password })
  client.on('error', (err) => console.log(`Redis error: ${err}`))
  client.on('reconnecting', () => console.log('Redis reconnecting...'))
  client.on('ready', () => console.log('Redis connected'))
  await client.connect()
}

const stop = async () => {
  if (client.isOpen) {
    await client.quit()
  }
}

const get = async (cache, key) => {
  const fullKey = getFullKey(cache, key)
  const value = await client.get(fullKey)
  return value ? JSON.parse(value) : {}
}

const set = async (cache, key, value) => {
  const fullKey = getFullKey(cache, key)
  const serializedValue = JSON.stringify(value)
  await client.set(fullKey, serializedValue, { EX: cacheConfig.ttl })
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

export default {
  start,
  stop,
  set,
  update,
}
