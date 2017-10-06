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

const app = new Koa()
const router = new Router()

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
    ctx.set('content-type', object.mime)
    ctx.body = object.content
  } catch (e) {
    if (e instanceof objectNotFoundError) ctx.throw(404, 'there is no object that has a given key.')
    if (e instanceof optionInvalidError) ctx.throw(400, e.message)
    throw e
  }
})

app.use(async (ctx, next) => {
  logger.log(`${ctx.method} ${ctx.path}, ${ctx.ip}, ${ctx.headers['user-agent']}`)
  await next()
})
// status cacher
app.use(async (ctx, next) => {
  let cache, status, message
  try {
    cache = await rCGet(`ms:pc:${ctx.path}`)
    if (!cache) {
      ctx.set('MS-SC-Status', 'MISS')
      await next()
      return
    } else {
      ctx.set('MS-SC-Status', 'HIT')
      const splittedCache = cache.split('/')
      status = Number.parseInt(splittedCache.shift())
      message = splittedCache.join('/')
    }
  } catch(e) {
    if (e.status) await rCSet(`ms:pc:${ctx.path}`, `${e.status}/${e.message}`, 'EX', 60 * 60 * 24)
    status = e.status
    message = e.message
  }
  ctx.status = status
  ctx.body = message
})
app.use(router.routes())

export default app
