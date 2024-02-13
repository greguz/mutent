export function isAsyncIterable (value) {
  return typeof value === 'object' && value !== null && Symbol.asyncIterator in value
}

export function isIterable (value) {
  return typeof value === 'object' && value !== null && Symbol.iterator in value
}
