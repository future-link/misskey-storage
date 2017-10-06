import dotenv from 'dotenv-safe'

function validator (config) {
  const errors = []

  const availableStorageTypes = [
    'S3',
    'LOCAL'
  ]

  if (!availableStorageTypes.includes(config.storage.type))
    errors.push(`[MS_STORAGE_TYPE] must be one of [${availableStorageTypes.join(', ')}].`)
  if (!config.ports.public) errors.push('[MS_PUBLIC_PORT] must set application standby port.')
  if (!config.ports.internal) errors.push('[MS_INTERNAL_PORT] must set internal standby port.')
  if (!config.passkey) errors.push('[MS_PASSKEY] must set Redis URI with clustering mode.')

  if (config.storage.type === 'S3') {
    if (!MS_STORAGE_S3_BUCKET_NAME)
      errors.push('[MS_STORAGE_S3_BUCKET_NAME] must set bucket name if MS_STORAGE_TYPE is "S3".')
    let awsCredInEnvironmentVariables = true
    [
      'AWS_ACCESS_KEY_ID',
      'AWS_SECRET_ACCESS_KEY'
    ].forEach(key => {
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
    max: Number.parseInt(process.env.MS_STORAGE_MAX_SIZE) || 5 * 1000 * 1000
  },
  ports: {
    internal: Number.parseInt(process.env.MS_INTERNAL_PORT),
    public: Number.parseInt(process.env.MS_PUBLIC_PORT)
  },
  flags: {
    clustering: process.argv.indexOf('--clustering') !== -1
  }
}

const errors = validator(config)
if (errors.length > 0) throw new Error(`'${errors.join(`', '`)}'`)

export default config
