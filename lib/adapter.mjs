import { MutentError } from './error.mjs'

/**
 * Return the customized Adapter's name (if any) or something descriptive
 * (if possibile).
 */
export function getAdapterName (adapter) {
  return typeof adapter === 'object' && adapter !== null
    ? adapter[Symbol.for('adapter-name')] || adapter.constructor.name
    : 'Unknown Adapter'
}

async function * findEntity (ctx) {
  const { adapter, argument, hooks, intent, options } = ctx

  if (!adapter.find) {
    throw new MutentError(
      'EMUT_PARTIAL_ADAPTER',
      'The adapter does not implement ".find" method',
      {
        adapter: getAdapterName(adapter),
        intent,
        argument,
        options
      }
    )
  }

  for (const hook of hooks.onFind) {
    await hook(argument, ctx)
  }

  const data = await adapter.find(argument, options)

  if (data !== null && data !== undefined) {
    yield data
  }
}

async function * filterEntities (ctx) {
  const { adapter, argument, hooks, intent, options } = ctx

  if (!adapter.filter) {
    throw new MutentError(
      'EMUT_PARTIAL_ADAPTER',
      'The adapter does not implement ".filter" method',
      {
        adapter: getAdapterName(adapter),
        intent,
        argument,
        options
      }
    )
  }

  for (const hook of hooks.onFilter) {
    await hook(argument, ctx)
  }

  yield * adapter.filter(argument, options)
}

export function iterateContext (ctx) {
  const { argument, intent, multiple } = ctx

  if (intent === 'FILTER') {
    return filterEntities(ctx)
  } else if (intent === 'FIND' || intent === 'READ') {
    return findEntity(ctx)
  } else if (multiple) {
    return argument
  } else {
    return asIterable(argument)
  }
}

/**
 * Wrap a single value into an `AsyncIterable`.
 */
async function * asIterable (argument) {
  const data = await (typeof argument === 'function' ? argument() : argument)
  if (data !== null && data !== undefined) {
    yield data
  }
}

async function createEntity (entity, ctx) {
  const { adapter, argument, hooks, intent, options } = ctx

  if (!adapter.create && !adapter.createEntity) {
    throw new MutentError(
      'EMUT_PARTIAL_ADAPTER',
      'The Adapter does not implement both the ".create" and ".createEntity" methods',
      {
        adapter: getAdapterName(adapter),
        intent,
        argument,
        options
      }
    )
  }

  for (const hook of hooks.beforeCreate) {
    await hook(entity, ctx)
  }

  if (adapter.createEntity) {
    await adapter.createEntity(entity, ctx)
  } else {
    const result = await adapter.create(entity.target, options)
    if (result !== null && result !== undefined) {
      entity.set(result)
    }
  }

  for (const hook of hooks.afterCreate) {
    await hook(entity, ctx)
  }
}

async function updateEntity (entity, ctx) {
  const { adapter, argument, hooks, intent, options } = ctx

  if (!adapter.update && !adapter.updateEntity) {
    throw new MutentError(
      'EMUT_PARTIAL_ADAPTER',
      'The Adapter does not implement both the ".update" and ".updateEntity" methods',
      {
        adapter: getAdapterName(adapter),
        intent,
        argument,
        options
      }
    )
  }

  for (const hook of hooks.beforeUpdate) {
    await hook(entity, ctx)
  }

  if (adapter.updateEntity) {
    await adapter.updateEntity(entity, ctx)
  } else {
    const result = await adapter.update(entity.source, entity.target, options)
    if (result !== null && result !== undefined) {
      entity.set(result)
    }
  }

  for (const hook of hooks.afterUpdate) {
    await hook(entity, ctx)
  }
}

async function deleteEntity (entity, ctx) {
  const { adapter, argument, hooks, intent, options } = ctx

  if (!adapter.delete && !adapter.deleteEntity) {
    throw new MutentError(
      'EMUT_PARTIAL_ADAPTER',
      'The Adapter does not implement both the ".delete" and ".deleteEntity" methods',
      {
        adapter: getAdapterName(adapter),
        intent,
        argument,
        options
      }
    )
  }

  for (const hook of hooks.beforeDelete) {
    await hook(entity, ctx)
  }

  if (adapter.deleteEntity) {
    await adapter.deleteEntity(entity, ctx)
  } else {
    await adapter.delete(entity.source, options)
  }

  for (const hook of hooks.afterDelete) {
    await hook(entity, ctx)
  }
}

/**
 * Single Adapter's write operation.
 */
export async function writeEntity (entity, ctx) {
  if (entity.shouldCreate) {
    await createEntity(entity, ctx)
  } else if (entity.shouldUpdate) {
    await updateEntity(entity, ctx)
  } else if (entity.shouldDelete) {
    await deleteEntity(entity, ctx)
  }
  return entity.commit()
}

export async function * sequentialWrite (iterable, ctx) {
  for await (const entity of iterable) {
    yield writeEntity(entity, ctx)
  }
}

export async function * concurrentWrite (iterable, ctx) {
  const { writeSize } = ctx

  let buffer = []
  for await (const entity of iterable) {
    buffer.push(entity)

    if (buffer.length >= writeSize) {
      const results = await Promise.all(
        buffer.map(item => writeEntity(item, ctx))
      )
      for (const result of results) {
        yield result
      }
      buffer = []
    }
  }
  if (buffer.length > 0) {
    const results = await Promise.all(
      buffer.map(item => writeEntity(item, ctx))
    )
    for (const result of results) {
      yield result
    }
    buffer = []
  }
}

export async function * bulkWrite (iterable, ctx) {
  const { adapter, argument, hooks, intent, options, writeSize } = ctx

  if (!adapter.bulk && !adapter.bulkEntities) {
    throw new MutentError(
      'EMUT_PARTIAL_ADAPTER',
      'The Adapter does not implement both the ".bulk" and ".bulkEntities" methods',
      {
        adapter: getAdapterName(adapter),
        intent,
        argument,
        options
      }
    )
  }

  let queue = []
  let waitingCommit = 0

  for await (const entity of iterable) {
    queue.push(setEntityHooks(entity, hooks))
    if (entity.shouldCommit) {
      // Preserve the Entities' order
      waitingCommit++
    }

    if (waitingCommit >= writeSize) {
      yield * flushQueue(queue, ctx)
      queue = []
      waitingCommit = 0
    }
  }

  if (queue.length > 0) {
    yield * flushQueue(queue, ctx)
    queue = []
    waitingCommit = 0
  }
}

/**
 * See `fireEntityHooksBefore` implementation.
 */
const K_BEFORE = Symbol('mutent-hooks-before')

/**
 * See `fireEntityHooksAfter` implementation.
 */
const K_AFTER = Symbol('mutent-hooks-after')

/**
 * Save adapter hooks inside Entity's meta.
 */
function setEntityHooks (entity, hooks) {
  if (entity.shouldCreate) {
    entity.meta[K_BEFORE] = hooks.beforeCreate
    entity.meta[K_AFTER] = hooks.afterCreate
  } else if (entity.shouldUpdate) {
    entity.meta[K_BEFORE] = hooks.beforeUpdate
    entity.meta[K_AFTER] = hooks.afterUpdate
  } else if (entity.shouldDelete) {
    entity.meta[K_BEFORE] = hooks.beforeDelete
    entity.meta[K_AFTER] = hooks.afterDelete
  }

  return entity
}

/**
 * Execute "before adapter write" hooks (if any).
 */
async function fireEntityHooksBefore (entity, ctx) {
  const hooks = entity.meta[K_BEFORE]
  if (hooks) {
    for (const hook of hooks) {
      await hook(entity, ctx)
    }
  }
}

/**
 * Execute "after adapter write" hooks (if any).
 * This function also remove the saved hooks.
 */
async function fireEntityHooksAfter (entity, ctx) {
  const hooks = entity.meta[K_AFTER]
  if (hooks) {
    for (const hook of hooks) {
      await hook(entity, ctx)
    }

    // Clean-up my dirt
    entity.meta[K_BEFORE] = undefined
    entity.meta[K_AFTER] = undefined
  }
}

async function * flushQueue (queue, ctx) {
  const { adapter } = ctx

  for (const entity of queue) {
    await fireEntityHooksBefore(entity, ctx)
  }

  const pending = queue.filter(e => e.shouldCommit)
  if (pending.length > 0) {
    if (adapter.bulkEntities) {
      await adapter.bulkEntities(pending, ctx)
    } else {
      const result = Object(
        await adapter.bulk(
          pending.map(createBulkAction),
          ctx.options
        )
      )

      for (let i = 0; i < pending.length; i++) {
        if (
          !pending[i].shouldDelete &&
          result[i] !== undefined &&
          result[i] !== null
        ) {
          pending[i].set(result[i])
        }
      }
    }
  }

  for (const entity of queue) {
    // Commit Entity before any other action
    entity.commit()
    // Fire the "after commit" hooks
    await fireEntityHooksAfter(entity, ctx)
    // Yield out the committed Entity
    yield entity
  }
}

function createBulkAction (entity) {
  if (entity.shouldCreate) {
    return {
      type: 'CREATE',
      data: entity.target
    }
  } else if (entity.shouldUpdate) {
    return {
      type: 'UPDATE',
      oldData: entity.source,
      newData: entity.target
    }
  } else if (entity.shouldDelete) {
    return {
      type: 'DELETE',
      data: entity.source
    }
  } else {
    throw new Error('Expected Entity to commit')
  }
}
