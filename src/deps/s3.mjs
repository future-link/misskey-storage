import S3 from 'aws-sdk/clients/s3'
import config from '../config'

export default new S3({
  ...config.storage.s3.config
})
