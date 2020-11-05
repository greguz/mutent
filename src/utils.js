export function isFunction(value) {
  return typeof value === 'function'
}

export function unlazy(lazy, arg) {
  return isFunction(lazy) ? lazy(arg) : lazy
}

export function isUndefined(value) {
  return value === undefined
}

export function isNull(value) {
  return value === null
}

export function isNil(value) {
  return isNull(value) || isUndefined(value)
}

export function objectify(value) {
  return typeof value === 'object' && !isNull(value) ? value : {}
}

export function coalesce(a, b) {
  return !isNil(a) ? a : b
}

export function isIterable(value) {
  return !isNull(value) && isFunction(value[Symbol.iterator])
}

export function isAsyncIterable(value) {
  return !isNull(value) && isFunction(value[Symbol.asyncIterator])
}
