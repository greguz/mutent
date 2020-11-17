export function unlazy(lazy, arg) {
  return typeof lazy === 'function' ? lazy(arg) : lazy
}

export function isNil(value) {
  return value === null || value === undefined
}

export function coalesce(a, b) {
  return isNil(a) ? b : a
}
