export function isAsyncIterable (value) {
  return Symbol.asyncIterator in Object(value)
}

export function isIterable (value) {
  return Symbol.iterator in Object(value)
}

export function unwrapIterable (value) {
  if (isIterable(value)) {
    return value[Symbol.iterator]()
  } else if (isAsyncIterable(value)) {
    return value[Symbol.asyncIterator]()
  } else {
    throw new TypeError('Value is not iterable')
  }
}
