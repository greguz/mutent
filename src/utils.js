export function unlazy(lazy, arg) {
  return typeof lazy === 'function' ? lazy(arg) : lazy
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
