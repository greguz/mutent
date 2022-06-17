import { bulkWrite, concurrentWrite, sequentialWrite } from './adapter.mjs'
import { unwrapIterable } from './iterable.mjs'

export function filter (predicate) {
  return async function * mutatorFilter (iterable) {
    let index = 0
    for await (const entity of iterable) {
      if (predicate(entity.valueOf(), index++)) {
        yield entity
      }
    }
  }
}

export function ddelete () {
  return async function * mutatorDelete (iterable) {
    for await (const entity of iterable) {
      yield entity.delete()
    }
  }
}

export function commit () {
  return function mutatorCommit (iterable, context) {
    const { adapter, multiple, writeSize } = context

    let writeMode = context.writeMode
    if (writeMode === 'AUTO' && writeSize >= 2) {
      writeMode = multiple && adapter.bulk ? 'BULK' : 'SEQUENTIAL'
    }

    if (writeMode === 'BULK') {
      return bulkWrite(iterable, context)
    } else if (writeMode === 'CONCURRENT') {
      return concurrentWrite(iterable, context)
    } else {
      return sequentialWrite(iterable, context)
    }
  }
}

function passthrough (iterable) {
  return iterable
}

export function iif (
  condition,
  whenTrue,
  whenFalse = passthrough
) {
  if (typeof condition === 'boolean') {
    return condition ? whenTrue : whenFalse
  }
  if (typeof condition !== 'function') {
    throw new TypeError('Condition must be either a boolean or a function')
  }
  return async function * mutatorConditional (iterSource, context) {
    const iterProxy = {
      [Symbol.iterator] () {
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

    const iterTrue = unwrapIterable(whenTrue(iterProxy, context))
    const iterFalse = unwrapIterable(whenFalse(iterProxy, context))

    let index = 0
    for await (const entity of iterSource) {
      // Choose the correct (target) iterable
      const iterTarget = condition(entity.valueOf(), index++)
        ? iterTrue
        : iterFalse

      // Prepare the proxy and retrieve the next value
      iterProxy.value = entity
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
    for await (const entity of iterable) {
      yield entity.update(await mapper(entity.valueOf(), index++))
    }
  }
}

export function assign (...objects) {
  return update((data) => Object.assign({}, data, ...objects))
}

export function tap (callback) {
  return async function * mutatorTap (iterable) {
    let index = 0
    for await (const entity of iterable) {
      await callback(entity.valueOf(), index++)
      yield entity
    }
  }
}

export function pipe (...mutators) {
  return function mutatorPipe (iterable, context) {
    return mutators.reduce(
      (accumulator, mutator) => mutator(accumulator, context),
      iterable
    )
  }
}
