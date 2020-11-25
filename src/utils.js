export function unlazy(lazy, arg) {
  return typeof lazy === 'function' ? lazy(arg) : lazy
}

export function coalesce(a, b) {
  return a === null || a === undefined ? b : a
}

export function isAsyncIterable(obj) {
  return obj !== null && typeof obj[Symbol.asyncIterator] === 'function'
}

export function isIterable(obj) {
  return obj !== null && typeof obj[Symbol.iterator] === 'function'
}
