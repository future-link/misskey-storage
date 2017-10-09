import gm from 'gm'

import objectCacheStore from './object-cache-store'

import { Logger } from '../../tools'

const logger = new Logger
const debug = (v) => { logger.detail(`get-object/edit-with-graphicsmagick - ${v}`) }

const editWithGM = (targetObject, options) => new Promise((resolve, reject) => {
  let query = gm(targetObject.content).autoOrient()
  let mime = targetObject.mime

  // thumbnail
  if (options.thumbnail) {
    mime = 'image/jpeg'
    query = query
      .resize(150, 150)
      .compress('jpeg')
      .quality('80')
  } else {
    // size
    if (options.size) query = query.resize(options.size, options.size)
    // quality
    if (options.quality) {
      mime = 'image/jpeg'
      query = query
        .compress('jpeg')
        .quality(options.quality)
    }
  }

  // set transparent color to white (use canvas default color)
  if (mime === 'image/jpeg') query = query.flatten()

  query.toBuffer((e, buffer) => {
    if (e) return reject(e)
    return resolve({
      size: buffer.length,
      content: buffer,
      mime,
      lastModified: (new Date()).toISOString()
    })
  })
})

const calculateCacheKey = (key, options) => {
  if (options.thumbnail) return key + '+t'
  let ck = key
  if (options.size) ck += `+s${options.size}`
  if (options.quality) ck += `+q${options.quality}`
  return ck
}

export default async (key, targetObject, options) => {
  debug('try to get a object from cache store...')
  const cachedObject = await objectCacheStore.read(calculateCacheKey(key, options), null)
  if (cachedObject && cachedObject.fresh) {
    debug('there is a valid object from cache store!')
    return cachedObject
  }

  debug('try to generate a object with graphicsmagick...')
  const generatedObject = await editWithGM(targetObject, options)
  debug('generation completed!')
  await objectCacheStore.write(calculateCacheKey(key, options), generatedObject)

  return generatedObject
}
