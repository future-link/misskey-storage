import config from '../../../config'

import { ContextErrorMimic } from '../../utils'

export const put = async (id, name, source) => { throw ContextErrorMimic(500, 'non implemented.') }
export const remove = async (id, name) => { throw ContextErrorMimic(500, 'non implemented.') }
export const rename = async (id, oldName, newName) => { throw ContextErrorMimic(500, 'non implemented.') }
