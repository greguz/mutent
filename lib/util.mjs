export function isObjectLike (value) {
  return typeof value === 'object' && value !== null
}

export function isAsyncIterable (value) {
  return isObjectLike(value) && Symbol.asyncIterator in value
}

export function isIterable (value) {
  return isObjectLike(value) && Symbol.iterator in value
}

export function isFunction (value) {
  return typeof value === 'function'
}

export function isPositiveInteger (value) {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
}

export function passthrough (value) {
  return value
}
