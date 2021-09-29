import { bulkWrite, sequentialWrite } from './adapter'
import { deleteStatus, updateStatus } from './status'

export function filter (predicate) {
  return async function * mutatorFilter (iterable) {
    let index = 0
    for await (const status of iterable) {
      if (predicate(status.target, index++)) {
        yield status
      }
    }
  }
}

export function ddelete () {
  return async function * mutatorDelete (iterable) {
    for await (const status of iterable) {
      yield deleteStatus(status)
    }
  }
}

export function commit () {
  return function mutatorCommit (iterable, options) {
    const { adapter, multiple } = this

    const mutentOptions = options.mutent || {}
    const writeMode = mutentOptions.writeMode || this.writeMode || 'AUTO'
    const autoBulk = writeMode === 'AUTO' && multiple && !!adapter.bulk

    if (writeMode === 'BULK' || autoBulk) {
      return bulkWrite(this, iterable, options)
    } else {
      return sequentialWrite(this, iterable, options)
    }
  }
}

async function * wrapValue (item) {
  yield item
}

async function unwrapIterable (iterable) {
  let result
  for await (const item of iterable) {
    result = item
  }
  return result
}

function passthrough (iterable) {
  return iterable
}

export function iif (
  condition,
  whenTrue = passthrough,
  whenFalse = passthrough
) {
  if (typeof condition !== 'function') {
    return condition ? whenTrue : whenFalse
  }
  return async function * mutatorConditional (iterable, options) {
    let index = 0
    for await (const status of iterable) {
      if (condition(status.target, index++)) {
        yield unwrapIterable(whenTrue.call(this, wrapValue(status), options))
      } else {
        yield unwrapIterable(whenFalse.call(this, wrapValue(status), options))
      }
    }
  }
}

export function update (mapper) {
  return async function * mutatorUpdate (iterable) {
    let index = 0
    for await (const status of iterable) {
      yield updateStatus(status, await mapper(status.target, index++))
    }
  }
}

export function assign (...objects) {
  return update((data) => Object.assign({}, data, ...objects))
}

export function tap (callback) {
  return async function * mutatorTap (iterable) {
    let index = 0
    for await (const status of iterable) {
      await callback(status.target, index++)
      yield status
    }
  }
}

export function pipe (...mutators) {
  return function mutatorPipe (iterable, options) {
    return mutators.reduce(
      (accumulator, mutator) => mutator.call(this, accumulator, options),
      iterable
    )
  }
}
