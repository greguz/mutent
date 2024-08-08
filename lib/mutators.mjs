import { bulkWrite, concurrentWrite, sequentialWrite } from './adapter.mjs'
import { Entity } from './entity.mjs'
import { isFunction, isPositiveInteger, passthrough } from './util.mjs'

export function ensure (one) {
  return async function * mutatorEnsure (iterable, ctx) {
    let exists = false
    for await (const entity of iterable) {
      exists = true
      yield entity
    }
    if (!exists) {
      const data = await (typeof one === 'function' ? one() : one)
      const entity = Entity.create(data)
      for (const hook of ctx.hooks.onEntity) {
        await hook(entity, ctx)
      }
      yield entity
    }
  }
}

export function filter (predicate) {
  if (!isFunction(predicate)) {
    throw new TypeError('Filter mutator expectes a predicate function')
  }

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

export function ddelete (predicate) {
  if (!predicate) {
    return mutatorDelete
  }
  if (!isFunction(predicate)) {
    throw new TypeError('Delete mutator expectes a predicate function')
  }

  return async function * mutatorDeleteConditional (iterable) {
    let index = 0
    for await (const entity of iterable) {
      if (await predicate(entity.valueOf(), index++)) {
        entity.delete()
      }
      yield entity
    }
  }
}

async function * mutatorCommit (iterable, ctx) {
  const { adapter, multiple, writeSize } = ctx

  let writeMode = ctx.writeMode
  if (writeMode === 'AUTO' && writeSize >= 2) {
    writeMode = multiple && (adapter.bulk || adapter.bulkEntities)
      ? 'BULK'
      : 'SEQUENTIAL'
  }

  if (writeMode === 'BULK') {
    yield * bulkWrite(iterable, ctx)
  } else if (writeMode === 'CONCURRENT') {
    yield * concurrentWrite(iterable, ctx)
  } else {
    yield * sequentialWrite(iterable, ctx)
  }
}

export function commit () {
  return mutatorCommit
}

export function update (mapper) {
  if (!isFunction(mapper)) {
    throw new TypeError('Update mutator expects a map function')
  }

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
  return function mutatorPipe (iterable, ctx) {
    return mutators.reduce(
      (accumulator, mutator) => mutator(accumulator, ctx),
      iterable
    )
  }
}

export function skip (n = 0) {
  if (n === 0) {
    return passthrough // keep the same iterable
  }
  if (!isPositiveInteger(n)) {
    throw new TypeError('Skip mutator expects a positive integer or zero')
  }

  return async function * mutatorSkip (iterable) {
    for await (const entity of iterable) {
      if (n > 0) {
        n--
      } else {
        yield entity
      }
    }
  }
}

export function limit (n) {
  if (!isPositiveInteger(n)) {
    throw new TypeError('Limit mutator expects a positive integer')
  }

  return async function * mutatorLimit (iterable) {
    for await (const entity of iterable) {
      if (n-- > 0) {
        yield entity
      } else {
        break
      }
    }
  }
}
