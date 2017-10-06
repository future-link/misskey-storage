import S3 from 'aws-sdk/clients/s3'

import config from '../../../config'

import objectCacheStore from '../object-cache-store'
import { objectNotFoundError } from '../errors'

const s3 = new S3()

const getObjectFromS3 = (key) => new Promise((resolve, reject) => {
  s3.getObject({
    Bucket: config.storage.s3.bucket,
    Key: key
  }, (e, data) => {
    if (e) {
      if (e.name === 'AccessDenied') return reject(new objectNotFoundError)
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
  const cachedContent = await objectCacheStore.read(key)
  if (cachedContent) return cachedContent
  const content = await getObjectFromS3(key)
  await objectCacheStore.write(key, content)
  return content
}

export default getObjectFromS3Wrapper
