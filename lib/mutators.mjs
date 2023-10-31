import { bulkWrite, concurrentWrite, sequentialWrite } from './adapter.mjs'
import { Entity } from './entity.mjs'

export function ensure (one) {
  return async function * mutatorEnsure (iterable, context) {
    let exists = false
    for await (const entity of iterable) {
      exists = true
      yield entity
    }
    if (!exists) {
      const data = await (typeof one === 'function' ? one() : one)
      const entity = Entity.create(data)
      for (const hook of context.hooks.onEntity) {
        await hook(entity, context)
      }
      yield entity
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

async function * mutatorDelete (iterable) {
  for await (const entity of iterable) {
    yield entity.delete()
  }
}

export function ddelete () {
  return mutatorDelete
}

async function * mutatorCommit (iterable, context) {
  const { adapter, multiple, writeSize } = context

  let writeMode = context.writeMode
  if (writeMode === 'AUTO' && writeSize >= 2) {
    writeMode = multiple && adapter.bulk ? 'BULK' : 'SEQUENTIAL'
  }

  if (writeMode === 'BULK') {
    yield * bulkWrite(iterable, context)
  } else if (writeMode === 'CONCURRENT') {
    yield * concurrentWrite(iterable, context)
  } else {
    yield * sequentialWrite(iterable, context)
  }
}

export function commit () {
  return mutatorCommit
}

export function update (mapper) {
  return async function * mutatorUpdate (iterable) {
    let index = 0
    for await (const entity of iterable) {
      const result = await mapper(entity.valueOf(), index++)
      if (result === undefined || result === null) {
        yield entity
      } else {
        yield entity.update(result)
      }
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
