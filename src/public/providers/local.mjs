import { ObjectNotFoundError } from '../common/errors'

const getObjectFromLocal = (key) => Promise.reject(new ObjectNotFoundError())
const purgeObjectFromLocal = (key) => Promise.reject(new ObjectNotFoundError())

export const get = getObjectFromLocal
export const purge = purgeObjectFromLocal
