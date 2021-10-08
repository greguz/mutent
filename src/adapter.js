import { MutentError } from './error'
import {
  isConstantValid,
  readConstants,
  writeConstants
} from './keywords/constant'
import {
  commitStatus,
  shouldCreate,
  shouldDelete,
  shouldUpdate,
  updateStatus
} from './status'

export function adapterFind ({ adapter, argument, hooks }, options) {
  if (hooks.onFind) {
    hooks.onFind(argument, options)
  }
  return adapter.find(argument, options)
}

export function adapterFilter ({ adapter, argument, hooks }, options) {
  if (hooks.onFilter) {
    hooks.onFilter(argument, options)
  }
  return adapter.filter(argument, options)
}

function validateConstants ({ intent, store }, status) {
  for (const constant of readConstants(status.source)) {
    if (!isConstantValid(constant, status.target)) {
      throw new MutentError('EMUT_CONSTANT', 'Constant value changed', {
        constant,
        data: status.target,
        intent,
        store
      })
    }
  }
}

function validateStatus ({ intent, store, validate }, status, options) {
  const mutentOptions = options.mutent || {}
  if (!mutentOptions.ignoreSchema && validate && !validate(status.target)) {
    throw new MutentError(
      'EMUT_INVALID_ENTITY',
      'Current entity does not match the configured schema',
      {
        data: status.target,
        errors: validate.errors,
        intent,
        store
      }
    )
  }
}

export async function adapterCreate (context, status, options) {
  const { adapter, hooks } = context
  validateStatus(context, status, options)
  if (hooks.beforeCreate) {
    await hooks.beforeCreate(status.target, options)
  }
  const result = await adapter.create(status.target, options)
  if (result !== null && result !== undefined) {
    status = updateStatus(status, result)
  }
  if (hooks.afterCreate) {
    await hooks.afterCreate(status.target, options)
  }
  return commitStatus(status)
}

export async function adapterUpdate (context, status, options) {
  const { adapter, hooks } = context
  validateStatus(context, status, options)
  validateConstants(context, status)
  if (hooks.beforeUpdate) {
    await hooks.beforeUpdate(status.source, status.target, options)
  }
  const result = await adapter.update(status.source, status.target, options)
  if (result !== null && result !== undefined) {
    status = updateStatus(
      status,
      writeConstants(result, readConstants(status.target))
    )
  }
  if (hooks.afterUpdate) {
    await hooks.afterUpdate(status.source, status.target, options)
  }
  return commitStatus(status)
}

export async function adapterDelete ({ adapter, hooks }, status, options) {
  if (hooks.beforeDelete) {
    await hooks.beforeDelete(status.source, options)
  }
  await adapter.delete(status.source, options)
  if (hooks.afterDelete) {
    await hooks.afterDelete(status.source, options)
  }
  return commitStatus(status)
}

export async function adapterWrite (context, status, options) {
  if (shouldCreate(status)) {
    return adapterCreate(context, status, options)
  } else if (shouldUpdate(status)) {
    return adapterUpdate(context, status, options)
  } else if (shouldDelete(status)) {
    return adapterDelete(context, status, options)
  } else {
    return commitStatus(status)
  }
}

export async function * sequentialWrite (context, iterable, options) {
  for await (const status of iterable) {
    yield adapterWrite(context, status, options)
  }
}

export async function * concurrentWrite (context, iterable, options) {
  const writeSize = getWriteSize(context, options)

  let buffer = []
  for await (const status of iterable) {
    buffer.push(status)

    if (buffer.length >= writeSize) {
      const results = await Promise.all(
        buffer.map(item => adapterWrite(context, item, options))
      )
      buffer = []
      for (const result of results) {
        yield result
      }
    }
  }
}

export async function * bulkWrite (context, iterable, options) {
  if (!context.adapter.bulk) {
    throw new MutentError(
      'EMUT_PARTIAL_ADAPTER',
      'The adapter does not implement the ".bulk" method',
      {
        intent: context.intent,
        store: context.store
      }
    )
  }

  const writeSize = getWriteSize(context, options)

  let items = []
  for await (const status of iterable) {
    const willCreate = shouldCreate(status)
    const willUpdate = shouldUpdate(status)
    const willDelete = shouldDelete(status)
    const willIgnore = !willCreate && !willUpdate && !willDelete

    if (willCreate) {
      validateStatus(context, status, options)
      items.push({ type: 'CREATE', status })
    } else if (willUpdate) {
      validateStatus(context, status, options)
      validateConstants(context, status)
      items.push({ type: 'UPDATE', status })
    } else if (willDelete) {
      items.push({ type: 'DELETE', status })
    }

    if (items.length > 0 && (willIgnore || items.length >= writeSize)) {
      for await (const status of flushBulkItems(context, items, options)) {
        yield status
      }
      items = []
    }

    if (willIgnore) {
      yield commitStatus(status)
    }
  }

  if (items.length > 0) {
    for await (const status of flushBulkItems(context, items, options)) {
      yield status
    }
  }
}

async function * flushBulkItems (context, items, options) {
  const { adapter, hooks, intent, store } = context

  if (hooks.beforeBulk) {
    await hooks.beforeBulk(items.map(createBulkAction), options)
  }

  const result = await adapter.bulk(items.map(createBulkAction), options)

  for (const key of Object.keys(Object(result))) {
    const item = items[key]
    if (!item) {
      throw new MutentError(
        'EMUT_UNEXPECTED_BULK_RESULT',
        'Found an unexpected bulk result key',
        {
          intent,
          key,
          length: items.length,
          store
        }
      )
    } else if (item.type === 'CREATE') {
      item.status = updateStatus(item.status, result[key])
    } else if (item.type === 'UPDATE') {
      item.status = updateStatus(
        item.status,
        writeConstants(result[key], readConstants(item.status.target))
      )
    }
  }

  if (hooks.afterBulk) {
    await hooks.afterBulk(items.map(createBulkAction), options)
  }

  for (const { status } of items) {
    yield commitStatus(status)
  }
}

function createBulkAction ({ type, status }) {
  if (type === 'CREATE') {
    return {
      type,
      data: status.target
    }
  } else if (type === 'UPDATE') {
    return {
      type,
      oldData: status.source,
      newData: status.target
    }
  } else {
    return {
      type,
      data: status.source
    }
  }
}

function getWriteSize (context, options) {
  const mutentOptions = options.mutent || {}
  let writeSize = mutentOptions.writeSize
  if (writeSize === null || writeSize === undefined) {
    writeSize = context.writeSize
  }
  if (writeSize === null || writeSize === undefined) {
    writeSize = 16
  }
  if (!Number.isInteger(writeSize) || writeSize <= 0) {
    throw new MutentError(
      'EMUT_INVALID_WRITE_SIZE',
      'Write size must be a positive integer',
      { writeSize }
    )
  }
  return writeSize
}
