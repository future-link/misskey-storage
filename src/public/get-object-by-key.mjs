export const objectNotFoundError = class extends Error {}
export const optionInvalidError = class extends Error {}

const optionsValidator = ({ quality }) => {
  if (quality && quality < 0 || quality > 100)
    throw new optionInvalidError(`'quality' can not be over 100, or under 0.`)
}

export default async (key, options) => {
  optionsValidator(options)
  throw new objectNotFoundError
}
