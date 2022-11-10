import { bulkWrite, concurrentWrite, sequentialWrite } from './adapter.mjs'
import { Entity } from './entity.mjs'

export function ensure (data) {
  return async function * mutatorEnsure (iterable) {
    let exists = false
    for await (const entity of iterable) {
      exists = true
      yield entity
    }
    if (!exists) {
      yield Entity.create(data)
    }
  }
}

export function filter (predicate) {
  return async function * mutatorFilter (iterable) {
    let index = 0
    for await (const entity of iterable) {
      if (await predicate(entity.valueOf(), index++)) {
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

export function update (mapper) {
  return async function * mutatorUpdate (iterable) {
    let index = 0
    for await (const entity of iterable) {
      yield entity.update(
        await mapper(entity.valueOf(), index++)
      )
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