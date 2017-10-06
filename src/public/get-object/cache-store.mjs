import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import util from 'util'

import config from '../../config'

const [ fsReadFile, fsWriteFile, fsMkdir ] = [
  util.promisify(fs.readFile).bind(fs.readFile),
  util.promisify(fs.writeFile).bind(fs.writeFile),
  util.promisify(fs.mkdir).bind(fs.mkdir)
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
        fsReadFile(this.path(calculateCacheHash(key) + '.json'), { encoding: 'utf8' }),
        fsReadFile(this.path(calculateCacheHash(key)))
      ])
      const object = Object.assign({ content }, JSON.parse(metadata))
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
        object,
        (key, value) => [ 'content' ].includes(key) ? undefined : value
      ))
    ])
  }
}

export default new CacheStore(config.storage.cache)
