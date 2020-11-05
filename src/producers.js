import Herry from 'herry'

import { isAsyncIterable, isIterable, isNull } from './utils'

export async function unwrapOne(input, mutate) {
  return mutate(await input)
}

export function iterateOne(input, mutate) {
  return {
    [Symbol.asyncIterator]: async function* () {
      const value = await unwrapOne(input, mutate)
      if (!isNull(value)) {
        yield value
      }
    }
  }
}

function createIterator(value) {
  if (isAsyncIterable(value)) {
    return value[Symbol.asyncIterator]()
  } else if (isIterable(value)) {
    return value[Symbol.iterator]()
  } else {
    throw new Herry('EMUT_NOT_ITERABLE', 'Expected an iterable', { value })
  }
}

export async function unwrapMany(input, mutate) {
  const iterator = createIterator(input)
  const results = []
  let active = true
  while (active) {
    const { done, value } = await iterator.next()
    if (done) {
      active = false
    } else {
      results.push(await mutate(value))
    }
  }
  return results
}

export function iterateMany(input, mutate) {
  return {
    [Symbol.asyncIterator]() {
      return {
        iterator: createIterator(input),
        async next() {
          const { done, value } = await this.iterator.next()
          return {
            done,
            value: done ? undefined : await mutate(value)
          }
        }
      }
    }
  }
}
