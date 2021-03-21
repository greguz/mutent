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
      yield this.write(status, options)
    }
  }
}

function isTrue(condition, data) {
  return typeof condition === 'function' ? condition(data) : condition
}

async function* makeOneShotIterable(item) {
  yield item
}

async function consumeOneShotIterable(iterable) {
  let result
  for await (const item of iterable) {
    result = item
  }
  return result
}

export function iif(condition, mutator) {
  return async function* mutatorConditional(iterable) {
    for await (const status of iterable) {
      if (isTrue(condition, status.target)) {
        yield consumeOneShotIterable(mutator(makeOneShotIterable(status)))
      } else {
        yield status
      }
    }
  }
}

export function unless(condition, mutator) {
  return iif(data => !isTrue(condition, data), mutator)
}

export function update(mapper) {
  return async function* mutatorUpdate(iterable) {
    let index = 0
    for await (const status of iterable) {
      yield updateStatus(status, await mapper(status.target), index++)
    }
  }
}

export function assign(object) {
  return update(data => Object.assign({}, data, object))
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
