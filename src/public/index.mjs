import Koa from 'koa'
import Router from 'koa-router'

import cluster from 'cluster'
import util from 'util'

import redis from 'redis'
const redisClient = redis.createClient(config.redis)
redisClient.on('error', e => { throw e })

const rCGet = util.promisify(redisClient.get).bind(redisClient)
const rCSet = util.promisify(redisClient.set).bind(redisClient)

import config from '../config'
import { Logger } from '../tools'

import getObject from './get-object'
import purgeObject from './purge-object'
import { objectNotFoundError, optionInvalidError } from './common/errors'

const logger = new Logger(cluster.isWorker ? `public#${cluster.worker.id}` : 'public')

const router = new Router()

// middleware for invalid status cache
router.use(async (ctx, next) => {
  let cache, status, message
  try {
    cache = await rCGet(`ms:pc:${ctx.path}`)
    if (!cache) {
      await next()
      return
    }
    const splittedCache = cache.split('/')
    status = Number.parseInt(splittedCache.shift())
    message = splittedCache.join('/')
  } catch(e) {
    if (!e.status) throw e
    await rCSet(`ms:pc:${ctx.path}`, `${e.status}/${e.message}`, 'EX', 60 * 60 * 24)
    status = e.status
    message = e.message
  }
  ctx.set('MS-ISC-Status', cache ? 'HIT' : 'MISS')
  ctx.status = status
  ctx.body = message
})

router.get('/(.*)', async ctx => {
  const key = ctx.params[0]
  const options = {
    thumbnail: ctx.query.thumbnail !== undefined,
    size: Number.parseInt(ctx.query.size) || null,
    quality: Number.parseInt(ctx.query.quality) || null
  }
  try {
    const object = await getObject(key, options)
    ctx.set('Last-Modified', (new Date(object.lastModified)).toUTCString())
    ctx.set('MS-Cache-Status', object.cache ? 'HIT' : 'MISS')
    if (ctx.headers['if-modified-since'] && Date.parse(ctx.headers['if-modified-since']) >= Date.parse(object.lastModified)) {
      ctx.status = 304
      return
    }
    ctx.set('Content-Type', object.mime)
    ctx.body = object.content
  } catch (e) {
    if (e instanceof objectNotFoundError) ctx.throw(404, 'there is no object that has a given key.')
    if (e instanceof optionInvalidError) ctx.throw(400, e.message)
    throw e
  }
})

router.purge('/(.*)', async ctx => {
  const key = ctx.params[0]
  try {
    await purgeObject(key)
    ctx.status = 204
    return
  } catch (e) {
    if (e instanceof objectNotFoundError) ctx.throw(404, 'there is no object that has a given key.')
    throw e
  }
})

const app = new Koa()

app.use(async (ctx, next) => {
  logger.log(`${ctx.method} ${ctx.path}, ${ctx.ip}, ${ctx.headers['user-agent']}`)
  await next()
})

// for CORS & 'OPTIONS' request
app.use((ctx, next) => {
  ctx.set('Access-Control-Allow-Origin', '*')
  if (ctx.method === 'OPTIONS') {
    if (ctx.header['access-control-request-method']) {
      ctx.set('Access-Control-Allow-Methods', 'GET, PURGE, OPTIONS')
      ctx.set('Access-Control-Allow-Headers', 'Content-Type')
    }
    ctx.status = 204
    return Promise.resolve()
  }
  return next()
})

// root
app.use((ctx, next) => {
  if (ctx.path !== '/') return next()
  if (!['GET'].includes(ctx.method)) {
    ctx.status = 405
    return Promise.resolve()
  }
  ctx.status = 204
  return Promise.resolve()
})

app.use(router.routes())

export default app
