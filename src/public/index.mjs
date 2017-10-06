import Koa from 'koa'
import Router from 'koa-router'

import cluster from 'cluster'

import config from '../config'
import { Logger } from '../tools'

import getObjectByKey, { objectNotFoundError, optionInvalidError } from './get-object-by-key'

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
    const object = await getObjectByKey(key, options)
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
app.use(router.routes())

export default app
