import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import util from 'util'

import config from '../../config'

const [ fsReadFile, fsWriteFile, fsMkdir, fsUnlink ] = [
  util.promisify(fs.readFile).bind(fs.readFile),
  util.promisify(fs.writeFile).bind(fs.writeFile),
  util.promisify(fs.mkdir).bind(fs.mkdir),
  util.promisify(fs.unlink).bind(fs.unlink)
]

const calculateCacheHash = (key) => {
  const hash = crypto.createHash('sha256')
  hash.update(key)
  return hash.digest('hex')
}

class CacheStore {
  constructor (cachePathBase) {
    this.basePath = cachePathBase
    this.basePathExistanceChecked = false
    this.path = (...paths) => path.join(cachePathBase, ...paths)
  }

  async read (key) {
    try {
      const [metadata, content] = await Promise.all([
        (async () => {
          const metadata = await fsReadFile(this.path(calculateCacheHash(key) + '.json'), { encoding: 'utf8' })
          return JSON.parse(metadata)
        })(),
        fsReadFile(this.path(calculateCacheHash(key)))
      ])
      // check expire (1day: 1000ms * 60s * 60m * 24h)
      const expireInMillisecond = Date.parse(metadata.created_at) + (1000 * 60 * 60 * 24)
      if (Date.now() > expireInMillisecond) {
        Promise.all([
          fsUnlink(this.path(calculateCacheHash(key) + '.json')),
          fsUnlink(this.path(calculateCacheHash(key)))
        ])
        return null
      }
      const object = Object.assign({
        content,
        cache: true
      }, metadata.object)
      return object
    } catch(e) {
      if (e.code !== 'ENOENT') throw e
    }
    return null
  }

  async write (key, object) {
    if (!this.basePathExistanceChecked) {
      try {
        await fsMkdir(this.basePath)
      } catch (e) {
        if (e.code !== 'EEXIST') throw e
      }
      this.basePathExistanceChecked = true
    }
    return await Promise.all([
      fsWriteFile(this.path(calculateCacheHash(key)), object.content, {
        encoding: null
      }),
      fsWriteFile(this.path(calculateCacheHash(key) + '.json'), JSON.stringify(
        {
          created_at: (new Date()).toISOString(),
          object
        },
        (key, value) => [ 'content' ].includes(key) ? undefined : value
      ))
    ])
  }
}

export default new CacheStore(config.storage.cache)
