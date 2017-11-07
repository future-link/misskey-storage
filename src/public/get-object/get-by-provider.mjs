import config from '../../config'
import providers from '../providers'

export default (key, options) => providers[config.storage.type].get(key)
