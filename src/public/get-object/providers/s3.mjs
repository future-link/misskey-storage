import S3 from 'aws-sdk/clients/s3'

import config from '../../../config'
import { Logger } from '../../../tools'

import objectCacheStore from '../object-cache-store'
import { objectNotFoundError } from '../errors'

const s3 = new S3()
const logger = new Logger
const debug = (v) => { logger.detail(`get-object/providers/s3 - ${v}`) }

const getObjectFromS3 = (key, params) => new Promise((resolve, reject) => {
  s3.getObject(Object.assign({
    Bucket: config.storage.s3.bucket,
    Key: key
  }, params), (e, data) => {
    if (e) {
      if (e.name === 'AccessDenied') {
        debug(`there is no object matching '${key}' in the S3 bucket.`)
        return reject(new objectNotFoundError)
      }
      return reject(e)
    }
    resolve({
      size: data.ContentLength,
      lastModified: data.LastModified,
      etag: data.ETag,
      mime: data.ContentType,
      content: data.Body
    })
  })
})

// caching wrapper
const getObjectFromS3Wrapper = async (key) => {
  debug('try to get a object from cache store...')
  const cachedObject = await objectCacheStore.read(key)
  if (cachedObject && cachedObject.fresh) {
    debug('there is a valid object from cache store!')
    return cachedObject
  }

  const params = {}
  if (cachedObject) params.IfNoneMatch = cachedObject.etag
  debug('try to get a object from the S3 bucket...')
  const object = await (async () => {
    try {
      const object = await getObjectFromS3(key, params)
      await objectCacheStore.write(key, object)
      return object
    } catch (e) {
      if (e instanceof objectNotFoundError && cachedObject) await objectCacheStore.remove(key)
      // https://github.com/aws/aws-sdk-js/blob/5880e725ca12f559fcead5cac2c305e55de1ccfb/lib/services/s3.js#L531
      if (e.name !== 'NotModified') throw e
      debug('the received object has no difference a object from cache, refresh it.')
      await objectCacheStore.refresh(key)
      return cachedObject
    }
  })()
  debug('there is a valid object from the S3 bucket!')

  return object
}

export default getObjectFromS3Wrapper
