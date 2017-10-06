import S3 from 'aws-sdk/clients/s3'
import fs from 'fs'
import util from 'util'

import config from '../../../config'
import { ContextErrorMimic } from '../../utils'

const s3 = new S3()

const [ fsReadFile ] = [ util.promisify(fs.readFile).bind(fs.readFile) ]

const putObjectToS3 = (key, binary) => new Promise((resolve, reject) => {
  s3.putObject({
    Bucket: config.storage.s3.bucket,
    Key: key,
    Body: binary
  }, (e, data) => {
    if (e) return reject(e)
    console.dir(data)
    return resolve(data)
  })
})

export const put = async (id, name, source) => {
  const binary = await fsReadFile(source)
  await putObjectToS3([id, name].join('/'), binary)
}

const deleteObjectFromS3 = key => new Promise((resolve, reject) => {
  s3.deleteObject({
    Bucket: config.storage.s3.bucket,
    Key: key
  }, (e, data) => {
    if (e) return reject(e)
    console.dir(data)
    return resolve(data)
  })
})

export const remove = async (id, name) => await deleteObjectFromS3([id, name].join('/'))

export const rename = async (id, oldName, newName) => { throw ContextErrorMimic(500, 'non implemented.') }
