import S3 from 'aws-sdk/clients/s3'
import fs from 'fs'
import util from 'util'
import fileType from 'file-type'

import config from '../../../config'
import { ContextErrorMimic } from '../../utils'

const s3 = new S3()

const [ fsReadFile ] = [ util.promisify(fs.readFile).bind(fs.readFile) ]

const putObjectToS3 = (key, binary, mimeType) => new Promise((resolve, reject) => {
  s3.putObject({
    Bucket: config.storage.s3.bucket,
    Key: key,
    Body: binary,
    ContentType: mimeType
  }, (e, data) => {
    if (e) return reject(e)
    return resolve(data)
  })
})

export const put = async (id, name, source, opts = {}) => {
  const binary = await fsReadFile(source)
  const mimeType = opts.mime || fileType(binary)
  await putObjectToS3([id, name].join('/'), binary, mimeType)
}

const deleteObjectFromS3 = key => new Promise((resolve, reject) => {
  s3.deleteObject({
    Bucket: config.storage.s3.bucket,
    Key: key
  }, (e, data) => {
    if (e) return reject(e)
    return resolve(data)
  })
})

export const remove = (id, name) => deleteObjectFromS3([id, name].join('/'))

export const rename = async (id, oldName, newName) => { throw ContextErrorMimic(500, 'non implemented.') }
