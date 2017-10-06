import Koa from 'koa'
import Router from 'koa-router'

import cluster from 'cluster'

import config from '../config'
import { Logger } from '../tools'

import v0 from './v0'

const logger = new Logger(cluster.isWorker ? `internal#${cluster.worker.id}` : 'internal')

const app = new Koa()
const router = new Router()

router.use('/v0', v0.routes())

app.use(async (ctx, next) => {
  logger.log(`${ctx.method} ${ctx.path}, ${ctx.ip}, ${ctx.headers['user-agent']}`)
  await next()
})
app.use(router.routes())

export default app
