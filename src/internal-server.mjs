import Koa from 'koa'
import Router from 'koa-router'

import cluster from 'cluster'

import config from './config'
import { Logger } from './tools'

import v0 from './v0'

const logger = new Logger(cluster.isWorker ? `internal#${cluster.worker.id}` : 'internal')

const app = new Koa()
const router = new Router()

router.use('/v0', v0.routes())

app.use(async (ctx, next) => {
  // ex: 2017/08/30 22:59:26 +0900 | app#6 | GET /, ::1, Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.101 Safari/537.36
  logger.log(`${ctx.method} ${ctx.path}, ${ctx.ip}, ${ctx.headers['user-agent']}`)
  await next()
})
app.use(router.routes())

export default app
