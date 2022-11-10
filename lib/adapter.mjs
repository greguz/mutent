import { MutentError } from './error.mjs'

export function getAdapterName (adapter) {
  return typeof adapter === 'object' && adapter !== null
    ? adapter[Symbol.for('adapter-name')] || adapter.constructor.name
    : 'Unknown Adapter'
}

function findEntity (context) {
  const { adapter, argument, hooks, intent, options } = context
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
    hook(argument, context)
  }
  return adapter.find(argument, options)
}

function filterEntities (context) {
  const { adapter, argument, hooks, intent, options } = context
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
    hook(argument, context)
  }
  return adapter.filter(argument, options)
}

export function iterateContext (context) {
  const { argument, intent, multiple } = context

  if (intent === 'FILTER') {
    return filterEntities(context)
  } else if (intent === 'FIND' || intent === 'READ') {
    return fromPromise(findEntity(context))
  } else if (multiple) {
    return argument
  } else {
    return fromPromise(typeof argument === 'function' ? argument() : argument)
  }
}

async function * fromPromise (blob) {
  const data = await blob
  if (data !== null && data !== undefined) {
    yield data
  }
}

async function createEntity (entity, context) {
  const { adapter, argument, hooks, intent, options } = context
  if (!adapter.create) {
    throw new MutentError(
      'EMUT_PARTIAL_ADAPTER',
      'The adapter does not implement ".create" method',
      {
        adapter: getAdapterName(adapter),
        intent,
        argument,
        options
      }
    )
  }
  for (const hook of hooks.beforeCreate) {
    await hook(entity, context)
  }
  const result = await adapter.create(entity.target, options)
  if (result !== null && result !== undefined) {
    entity.set(result)
  }
  for (const hook of hooks.afterCreate) {
    await hook(entity, context)
  }
}

async function updateEntity (entity, context) {
  const { adapter, argument, hooks, intent, options } = context
  if (!adapter.update) {
    throw new MutentError(
      'EMUT_PARTIAL_ADAPTER',
      'The adapter does not implement ".update" method',
      {
        adapter: getAdapterName(adapter),
        intent,
        argument,
        options
      }
    )
  }
  for (const hook of hooks.beforeUpdate) {
    await hook(entity, context)
  }
  const result = await adapter.update(entity.source, entity.target, options)
  if (result !== null && result !== undefined) {
    entity.set(result)
  }
  for (const hook of hooks.afterUpdate) {
    await hook(entity, context)
  }
}

async function deleteEntity (entity, context) {
  const { adapter, argument, hooks, intent, options } = context
  if (!adapter.delete) {
    throw new MutentError(
      'EMUT_PARTIAL_ADAPTER',
      'The adapter does not implement ".delete" method',
      {
        adapter: getAdapterName(adapter),
        intent,
        argument,
        options
      }
    )
  }
  for (const hook of hooks.beforeDelete) {
    await hook(entity, context)
  }
  await adapter.delete(entity.source, options)
  for (const hook of hooks.afterDelete) {
    await hook(entity, context)
  }
}

export async function writeEntity (entity, context) {
  if (entity.shouldCreate) {
    await createEntity(entity, context)
  } else if (entity.shouldUpdate) {
    await updateEntity(entity, context)
  } else if (entity.shouldDelete) {
    await deleteEntity(entity, context)
  }
  return entity.commit()
}

export async function * sequentialWrite (iterable, context) {
  for await (const entity of iterable) {
    yield writeEntity(entity, context)
  }
}

export async function * concurrentWrite (iterable, context) {
  const { writeSize } = context

  let buffer = []
  for await (const entity of iterable) {
    buffer.push(entity)

    if (buffer.length >= writeSize) {
      const results = await Promise.all(
        buffer.map(item => writeEntity(item, context))
      )
      for (const result of results) {
        yield result
      }
      buffer = []
    }
  }
  if (buffer.length > 0) {
    const results = await Promise.all(
      buffer.map(item => writeEntity(item, context))
    )
    for (const result of results) {
      yield result
    }
    buffer = []
  }
}

export async function * bulkWrite (iterable, context) {
  const { adapter, argument, intent, options, writeSize } = context
  if (!adapter.bulk) {
    throw new MutentError(
      'EMUT_PARTIAL_ADAPTER',
      'The adapter does not implement ".bulk" method',
      {
        adapter: getAdapterName(adapter),
        intent,
        argument,
        options
      }
    )
  }

  let buffer = []
  for await (const entity of iterable) {
    let shouldIgnore = false
    if (entity.shouldCreate) {
      buffer.push({ type: 'CREATE', entity })
    } else if (entity.shouldUpdate) {
      buffer.push({ type: 'UPDATE', entity })
    } else if (entity.shouldDelete) {
      buffer.push({ type: 'DELETE', entity })
    } else {
      shouldIgnore = true
    }

    if (buffer.length >= writeSize || (shouldIgnore && buffer.length > 0)) {
      for await (const e of flushBuffer(buffer, context)) {
        yield e
      }
      buffer = []
    }

    if (shouldIgnore) {
      yield entity.commit()
    }
  }

  if (buffer.length > 0) {
    for await (const e of flushBuffer(buffer, context)) {
      yield e
    }
    buffer = []
  }
}

async function * flushBuffer (buffer, context) {
  const { adapter, hooks, options } = context

  for (const { type, entity } of buffer) {
    let iterable
    if (type === 'CREATE') {
      iterable = hooks.beforeCreate
    } else if (type === 'UPDATE') {
      iterable = hooks.beforeUpdate
    } else {
      iterable = hooks.beforeDelete
    }
    for (const hook of iterable) {
      await hook(entity, context)
    }
  }

  const result = await adapter.bulk(buffer.map(createBulkAction), options)
  for (const key of Object.keys(Object(result))) {
    const item = buffer[key]
    if (item && (item.type === 'CREATE' || item.type === 'UPDATE')) {
      item.entity.set(result[key])
    }
  }

  for (const { type, entity } of buffer) {
    let iterable
    if (type === 'CREATE') {
      iterable = hooks.afterCreate
    } else if (type === 'UPDATE') {
      iterable = hooks.afterUpdate
    } else {
      iterable = hooks.afterDelete
    }
    for (const hook of iterable) {
      await hook(entity, context)
    }
  }

  for (const { entity } of buffer) {
    yield entity.commit()
  }
}

function createBulkAction ({ type, entity }) {
  if (type === 'CREATE') {
    return {
      type,
      data: entity.target
    }
  } else if (type === 'UPDATE') {
    return {
      type,
      oldData: entity.source,
      newData: entity.target
    }
  } else {
    return {
      type,
      data: entity.source
    }
  }
}
