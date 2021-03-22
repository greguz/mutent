import { writeStatus } from './driver'
import { deleteStatus, updateStatus } from './status'

export function filter(predicate) {
  return async function* mutatorFilter(iterable) {
    let index = 0
    for await (const status of iterable) {
      if (predicate(status.target, index++)) {
        yield status
      }
    }
  }
}

export function ddelete() {
  return async function* mutatorDelete(iterable) {
    for await (const status of iterable) {
      yield deleteStatus(status)
    }
  }
}

export function commit() {
  return async function* mutatorCommit(iterable, options) {
    for await (const status of iterable) {
      yield writeStatus(this, status, options)
    }
  }
}

async function* wrapValue(item) {
  yield item
}

async function unwrapIterable(iterable) {
  let result
  for await (const item of iterable) {
    result = item
  }
  return result
}

function passthrough(value) {
  return value
}

export function iif(
  condition,
  whenTrue = passthrough,
  whenFalse = passthrough
) {
  if (typeof condition !== 'function') {
    return condition ? whenTrue : whenFalse
  }
  return async function* mutatorConditional(iterable) {
    for await (const status of iterable) {
      if (condition(status.target)) {
        yield unwrapIterable(whenTrue(wrapValue(status)))
      } else {
        yield unwrapIterable(whenFalse(wrapValue(status)))
      }
    }
  }
}

export function update(mapper) {
  return async function* mutatorUpdate(iterable) {
    let index = 0
    for await (const status of iterable) {
      yield updateStatus(status, await mapper(status.target), index++)
    }
  }
}

export function assign(...objects) {
  return update(data => Object.assign({}, data, ...objects))
}

export function tap(tapper) {
  return async function* mutatorTap(iterable) {
    let index = 0
    for await (const status of iterable) {
      await tapper(status.target, index++)
      yield status
    }
  }
}

export function pipe(...mutators) {
  return function mutatorPipe(iterable, options) {
    return mutators.reduce(
      (accumulator, mutator) => mutator.call(this, accumulator, options),
      iterable
    )
  }
}
