export function unlazy(lazy, arg) {
  return typeof lazy === 'function' ? lazy(arg) : lazy
}

export function isNil(value) {
  return value === null || value === undefined
}

export function coalesce(a, b) {
  return isNil(a) ? b : a
}

export function isAsyncIterable(obj) {
  return obj !== null && typeof obj[Symbol.asyncIterator] === 'function'
}

export function isIterable(obj) {
  return obj !== null && typeof obj[Symbol.iterator] === 'function'
}
