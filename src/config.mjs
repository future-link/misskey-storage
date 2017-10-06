import dotenv from 'dotenv-safe'
import path from 'path'

function validator (config) {
  const errors = []

  const availableStorageTypes = [
    'S3',
    'LOCAL'
  ]

  if (!availableStorageTypes.includes(config.storage.type))
    errors.push(`[MS_STORAGE_TYPE] must be one of [${availableStorageTypes.join(', ')}].`)
  if (config.services.includes('public') && !config.ports.public) errors.push('[MS_PUBLIC_PORT] must set application standby port.')
  if (config.services.includes('internal') && !config.ports.internal) errors.push('[MS_INTERNAL_PORT] must set internal standby port.')
  if (config.services.includes('internal') && !config.passkey) errors.push('[MS_PASSKEY] must set passkey for internal service.')
  if (config.services.includes('public') && config.flags.clustering && !config.redis) errors.push('[MS_REDIS_URI] must set redis URI with clustering mode.')

  if (1 > config.services.length) errors.push('[MS_ENABLED_SERVER_SERVICES] must set one or more service(s).')
  config.services.forEach(service => {
    if(!['internal', 'public'].includes(service)) errors.push(`[MS_ENABLED_SERVER_SERVICES] unknown service '${service}' setted.`)
  })

  if (config.storage.type === 'S3') {
    if (!config.storage.s3.bucket)
      errors.push('[MS_STORAGE_S3_BUCKET_NAME] must set bucket name if MS_STORAGE_TYPE is "S3".')
    let awsCredInEnvironmentVariables = true
    const keys = [ 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY' ]
    keys.forEach(key => {
      if (!process.env[key]) awsCredInEnvironmentVariables = false
    })
    if (!awsCredInEnvironmentVariables)
      errors.push('[MS_STORAGE_TYPE] if value "S3" presented, you must set AWS SDK Credentials to Environment Variables. see http://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/loading-node-credentials-environment.html.')
  }

  return errors
}

dotenv.load({
  allowEmptyValues: true
})

const config = {
  passkey: process.env.MS_PASSKEY,
  storage: {
    type: process.env.MS_STORAGE_TYPE,
    // default 5MB
    max: Number.parseInt(process.env.MS_STORAGE_MAX_SIZE) || 5 * 1000 * 1000,
    // path, for type 'LOCAL'
    local: {
      path: path.resolve(process.env.MS_STORAGE_PATH || './uploads')
    },
    s3: {
      bucket: process.env.MS_STORAGE_S3_BUCKET_NAME
    },
    cache: path.resolve(process.env.MS_STORAGE_CACHE_PATH || './cache')
  },
  ports: {
    internal: Number.parseInt(process.env.MS_INTERNAL_PORT),
    public: Number.parseInt(process.env.MS_PUBLIC_PORT)
  },
  flags: {
    clustering: process.argv.indexOf('--clustering') !== -1
  },
  redis: process.env.MS_REDIS_URI,
  services:
    process.env.MS_ENABLED_SERVER_SERVICES ?
      process.env.MS_ENABLED_SERVER_SERVICES.split(',') :
      [ 'internal', 'public' ]
}

const errors = validator(config)
if (errors.length > 0) throw new Error(`'${errors.join(`', '`)}'`)

export default config
