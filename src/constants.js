import get from 'lodash.get'

const symbol = Symbol('mutent_constants')

export function writeConstants(object, constants) {
  Object.defineProperty(object, symbol, {
    configurable: true,
    value: constants
  })
  return object
}

export function readConstants(object) {
  return object[symbol] || []
}

export function pushConstant(object, path, value) {
  const constant = { path, value }
  if (Object.prototype.hasOwnProperty.call(object, symbol)) {
    object[symbol].push(constant)
  } else {
    writeConstants(object, [constant])
  }
}

export function isConstantValid({ path, value }, data) {
  return get(data, path) === value
}
