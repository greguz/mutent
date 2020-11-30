import get from 'lodash.get'

const symbol = Symbol('mutent_constants')

export function pushConstant(object, path, value) {
  const constant = { path, value }
  if (Object.prototype.hasOwnProperty.call(object, symbol)) {
    object[symbol].push(constant)
  } else {
    Object.defineProperty(object, symbol, {
      configurable: true,
      value: [constant]
    })
  }
}

export function readConstants(object) {
  const constants = object[symbol]
  if (!constants) {
    return []
  }
  delete object[symbol]
  return constants
}

export function isConstantValid({ path, value }, data) {
  return get(data, path) === value
}
