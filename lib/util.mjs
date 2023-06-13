export function isAsyncIterable (value) {
  return Symbol.asyncIterator in Object(value)
}

export function isIterable (value) {
  return Symbol.iterator in Object(value)
}
