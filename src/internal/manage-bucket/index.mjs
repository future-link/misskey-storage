import providers from './providers'

import config from '../../config'

export const put = providers[config.storage.type].put
export const remove = providers[config.storage.type].remove
export const rename = providers[config.storage.type].rename
