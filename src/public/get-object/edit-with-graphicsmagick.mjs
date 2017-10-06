import gm from 'gm'

import objectCacheStore from './object-cache-store'

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
  const cachedObject = await objectCacheStore.read(calculateCacheKey(key, options))
  if (cachedObject) return cachedObject

  const generatedObject = await editWithGM(targetObject, options)
  await objectCacheStore.write(calculateCacheKey(key, options), generatedObject)

  return generatedObject
}
