import cluster from 'cluster'
import os from 'os'

import internalServer from './internal'
import publicServer from './public'
import config from './config'

import { Logger } from './tools'

const logger = new Logger(cluster.isMaster ? 'master' : 'worker')

/**
 * signature
 */
if (cluster.isMaster) {
  console.log('> misskey storage provider')
  console.log('> https://github.com/future-link/misskey-storage')
  console.log(`> server will listen, ${Object.entries(config.ports).map(e => `port ${e[1]} for ${e[0]}`).join(', ')}` + '\n')
}

if (cluster.isMaster && config.flags.clustering) {
  // cpu cores counter
  const cpuCores = os.cpus().length

  // worker exited, notice to console & re-fork.
  cluster.on('exit', (worker) => {
    logger.log(`worker number ${worker.id} is down.`)
    cluster.fork()
  })

  // worker in prepare time, notice to console.
  cluster.on('online', (worker) => {
    logger.log(`worker number ${worker.id} is online.`)
  })

  // fork workers each cpu cores.
  for (let i = 0; i < cpuCores; i++) {
    cluster.fork()
  }
} else {
  internalServer.listen(config.ports.internal)
  publicServer.listen(config.ports.public)
  // notice worker number in worker
  if (cluster.isWorker) logger.log(`worker number ${cluster.worker.id} is ready.`)
}
