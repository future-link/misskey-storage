import { objectNotFoundError } from '../common/errors'

const getObjectFromLocal = (key) => new Promise((resolve, reject) => {
  reject(new objectNotFoundError)
})

const purgeObjectFromLocal = (key) => new Promise((resolve, reject) => {
  reject(new objectNotFoundError)
})

export const get = getObjectFromLocal
export const purge = purgeObjectFromLocal
