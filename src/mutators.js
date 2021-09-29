import { bulkWrite, sequentialWrite } from './adapter'
import { unwrapIterable } from './iterable'
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

function passthrough (iterable) {
  return iterable
}

export function iif (
  condition,
  whenTrue = passthrough,
  whenFalse = passthrough
) {
  if (typeof condition === 'boolean') {
    return condition ? whenTrue : whenFalse
  }
  if (typeof condition !== 'function') {
    throw new TypeError('Condition must be either a boolean or a function')
  }
  return async function * mutatorConditional (iterSource, options) {
    const iterProxy = {
      [Symbol.iterator]() {
        return this
      },
      next () {
        const value = this.value
        this.value = undefined
        return {
          done: value === undefined,
          value
        }
      },
      value: undefined
    }

    const iterTrue = unwrapIterable(whenTrue.call(this, iterProxy, options))
    const iterFalse = unwrapIterable(whenFalse.call(this, iterProxy, options))

    let index = 0
    for await (const status of iterSource) {
      // Choose the correct (target) iterable
      const iterTarget = condition(status.target, index++)
        ? iterTrue
        : iterFalse

      // Prepare the proxy and retrieve the next value
      iterProxy.value = status
      const result = await iterTarget.next()

      // Yield out the result
      yield result.value
    }

    // Close map iterables
    await Promise.all([
      iterTrue.next(),
      iterFalse.next()
    ])
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
