import Koa from 'koa'
import Router from 'koa-router'

import cluster from 'cluster'

import config from '../config'
import { Logger } from '../tools'

const logger = new Logger(cluster.isWorker ? `public#${cluster.worker.id}` : 'public')

const app = new Koa()
const router = new Router()

app.use(async (ctx, next) => {
  logger.log(`${ctx.method} ${ctx.path}, ${ctx.ip}, ${ctx.headers['user-agent']}`)
  await next()
})
app.use(router.routes())

export default app
