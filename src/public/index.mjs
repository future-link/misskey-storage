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

import getObject, { objectNotFoundError, optionInvalidError } from './get-object'

const logger = new Logger(cluster.isWorker ? `public#${cluster.worker.id}` : 'public')

const router = new Router()

// middleware for CORS
// CORS
router.use(async (ctx, next) => {
  ctx.set('Access-Control-Allow-Origin', '*')
  if (ctx.method === 'OPTIONS' && ctx.header['access-control-request-method']) {
    ctx.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    ctx.set('Access-Control-Allow-Headers', 'Content-Type')
    ctx.status = 204
    return
  }
  await next()
})

// middleware for invalid status cache
router.use(async (ctx, next) => {
  let cache, status, message
  try {
    cache = await rCGet(`ms:pc:${ctx.path}`)
    if (!cache) {
      ctx.set('MS-ISC-Status', 'MISS')
      await next()
      return
    } else {
      ctx.set('MS-ISC-Status', 'HIT')
      const splittedCache = cache.split('/')
      status = Number.parseInt(splittedCache.shift())
      message = splittedCache.join('/')
    }
  } catch(e) {
    if (!e.status) throw e
    await rCSet(`ms:pc:${ctx.path}`, `${e.status}/${e.message}`, 'EX', 60 * 60 * 24)
    status = e.status
    message = e.message
  }
  ctx.status = status
  ctx.body = message
})

router.get('/', async ctx => {
  ctx.status = 204
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
    ctx.set('Last-Modified', (new Date(object.lastModified).toUTCString()))
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

const app = new Koa()

app.use(async (ctx, next) => {
  logger.log(`${ctx.method} ${ctx.path}, ${ctx.ip}, ${ctx.headers['user-agent']}`)
  await next()
})

app.use(router.routes())

export default app
