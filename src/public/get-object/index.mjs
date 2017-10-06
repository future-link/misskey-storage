import getByProvider from './get-by-provider'
import editWithGraphicsMagick from './edit-with-graphicsmagick'
import { optionInvalidError } from './errors'

const optionsValidator = ({ quality }) => {
  if (quality && quality < 0 || quality > 100)
    throw new optionInvalidError(`'quality' can not be over 100, or under 0.`)
}

const checkOptionsHasDifferenceFromDefault = (options) => {
  let noOption = true
  Object.values(options).forEach(option => { if (option) noOption = false })
  return !noOption
}

export * from './errors'

export default async (key, options) => {
  optionsValidator(options)
  const object = await getByProvider(key)
  if (!checkOptionsHasDifferenceFromDefault(options)) return object
  return await editWithGraphicsMagick(key, object, options)
}
