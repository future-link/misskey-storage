import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import util from 'util'

import config from '../../config'
import { Logger } from '../../tools'
import { objectNotFoundError } from './errors'

const logger = new Logger
const debug = (v) => { logger.detail(`get-object/object-cache-store - ${v}`) }

const [ fsReadFile, fsWriteFile, fsMkdir, fsUnlink ] = [
  util.promisify(fs.readFile).bind(fs.readFile),
  util.promisify(fs.writeFile).bind(fs.writeFile),
  util.promisify(fs.mkdir).bind(fs.mkdir),
  util.promisify(fs.unlink).bind(fs.unlink)
]

// quiet unlink runner with killing errors
const fsUnlinkQuiet = (...rest) => fsUnlink(...rest).catch(e => { return })

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

  /**
   * read: read from cache store
   *
   * @param key cache object key that reads
   * @param expireAfter expired after this param (ms).
   *   default expire value -> 1day: 1000ms * 60s * 60m * 24h
   *   special value null specified, pass checking expiration
   * @returns object or null
   *   if there is no object in cache store, returns null
   */
  async read (key, expireAfter = 1000 * 60 * 60 * 24) {
    debug(`[read] request '${key}'`)
    try {
      const [metadata, content] = await Promise.all([
        fsReadFile(this.path(calculateCacheHash(key) + '.json'), { encoding: 'utf8' }).then(JSON.parse),
        fsReadFile(this.path(calculateCacheHash(key)))
      ])
      // check whether the cached content is fresh
      const fresh = (() => {
        if (expireAfter === null) return true
        // if purged object, return always false
        if (metadata.purged) return false
        const expirirationTimeInMillisecond = Date.parse(metadata.available_at) + expireAfter
        return expirirationTimeInMillisecond > Date.now()
      })()
      return Object.assign({
        content,
        cache: true,
        fresh
      }, metadata.object)
    } catch(e) {
      if (e.code !== 'ENOENT') throw e
    }
    debug(`[read] there is no object matching '${key}' in cache store.`)
    return null
  }

  async write (key, object) {
    debug(`[write] request '${key}'`)
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
          available_at: (new Date()).toISOString(),
          object
        },
        (key, value) => [ 'content' ].includes(key) ? undefined : value
      ))
    ])
  }

  // refresh available_at of the metadata in a cached object
  async refresh (key) {
    debug(`[refresh] request '${key}'`)
    try {
      const metadata = await fsReadFile(this.path(calculateCacheHash(key) + '.json'), { encoding: 'utf8' }).then(JSON.parse)
      metadata.available_at = (new Date()).toISOString()
      delete metadata.purged
      await fsWriteFile(this.path(calculateCacheHash(key) + '.json'), JSON.stringify(metadata))
      return
    } catch (e) {
      if (e.code !== 'ENOENT') throw e
    }
    throw new objectNotFoundError
  }

  remove (key) {
    debug(`[remove] request '${key}'`)
    return Promise.all([
      fsUnlinkQuiet(this.path(calculateCacheHash(key) + '.json')),
      fsUnlinkQuiet(this.path(calculateCacheHash(key)))
    ])
  }

  async purge (key) {
    debug(`[purge] request '${key}'`)
    try {
      const metadata = await fsReadFile(this.path(calculateCacheHash(key) + '.json'), { encoding: 'utf8' }).then(JSON.parse)
      if (metadata.purged) return
      metadata.purged = true
      await fsWriteFile(this.path(calculateCacheHash(key) + '.json'), JSON.stringify(metadata))
      return
    } catch (e) {
      if (e.code !== 'ENOENT') throw e
    }
    throw new objectNotFoundError
  }
}

export default new CacheStore(config.storage.cache)
