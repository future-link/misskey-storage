import fs from 'fs'
import util from 'util'
import Router from 'koa-router'
import formidable from 'formidable'

import config from '../../config'

import * as common from '../common'

const unlink = util.promisify(fs.unlink)

const v0 = new Router()

// formidable wrapper to add maxReceivedSize.
const formidableWrapperOutOfMaxReceivedSizeErrorMessage = 'detect out of maxReceivedSize.'
const formidableWrapper = (req, opts = {}) => new Promise((resolve, reject) => {
  const maxReceivedSize = opts.maxReceivedSize || null
  delete opts.maxReceivedSize

  const form = new formidable.IncomingForm(opts)

  form.on('progress', receivedBytes => {
    if (maxReceivedSize && receivedBytes > maxReceivedSize)
      // automatic unlink with _error function: https://github.com/felixge/node-formidable/blob/c7e47cd640026d12b64b9270ecb60f6c2585c337/lib/incoming_form.js#L292-L306
      form._error(new Error(formidableWrapperOutOfMaxReceivedSizeErrorMessage))
  })

  form.on('error', e => { reject(e) })

  form.parse(req, (e, fields, files) => { resolve({ fields, files }) })
})

// missing field(s) checker
const missingFieldsChecker = (ctx, necessaryFields) => {
  const { fields } = ctx.request.body
  const nonSpecifiedFields = necessaryFields.filter(field => !fields[field])
  if (nonSpecifiedFields.length > 0) ctx.throw(400, `missing '${nonSpecifiedFields.join(`', '`)}' ${nonSpecifiedFields.length === 1 ? 'field' : 'fields'}.`)
}

// formidable middleware
v0.use(async (ctx, next) => {
  try {
    ctx.request.body = await formidableWrapper(ctx.req, {
      maxReceivedSize: config.storage.max
    })
  } catch (e) {
    if (e.message === formidableWrapperOutOfMaxReceivedSizeErrorMessage)
      ctx.throw(413, `payload size out of ${config.storage.max} bytes.`)
    throw e
  }

  await next()

  // clean-up temporary files
  await Promise.all(Object.values(ctx.request.body.files).map(file => unlink(file.path)))
})

// authenticate
v0.use(async (ctx, next) => {
  missingFieldsChecker(ctx, [ 'passkey' ])
  if (ctx.request.body.fields.passkey !== config.passkey) ctx.throw(400, `invalid 'passkey' field.`)
  await next()
})

v0.post('/register', async ctx => {
  const { files, fields } = ctx.request.body

  if (!files.file) ctx.throw(400, `missing file field named 'file'.`)
  missingFieldsChecker(ctx, [ 'file-id' ])

  ctx.body = await common.upload(fields['file-id'], files.file.name, files.file.path)
})

v0.put('/rename', async ctx => {
  const { files, fields } = ctx.request.body

  missingFieldsChecker(ctx, [ 'old-path', 'new-name' ])
  const splitedPath = fields['old-path'].split('/')
  const id = splitedPath.shift()
  const oldName = splittedPath.join('/')

  await common.rename(id, oldName, fields['new-name'])
  ctx.status = 204
})

v0.delete('/delete', async ctx => {
  const { files, fields } = ctx.request.body

  missingFieldsChecker(ctx, [ 'path' ])
  const splitedPath = fields['path'].split('/')
  const id = splitedPath.shift()
  const name = splittedPath.join('/')

  await common.delete(id, name)
  ctx.status = 204
})

export default v0
