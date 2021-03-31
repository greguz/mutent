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

export function adapterFind({ adapter, argument, hooks }, options) {
  if (hooks.onFind) {
    hooks.onFind(argument, options)
  }
  return adapter.find(argument, options)
}

export function adapterFilter({ adapter, argument, hooks }, options) {
  if (hooks.onFilter) {
    hooks.onFilter(argument, options)
  }
  return adapter.filter(argument, options)
}

function validateConstants({ intent, store }, status) {
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

function validateStatus({ intent, store, validate }, status) {
  if (validate && !validate(status.target)) {
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

export async function adapterCreate(context, status, options) {
  const { adapter, hooks } = context
  validateStatus(context, status)
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

export async function adapterUpdate(context, status, options) {
  const { adapter, hooks } = context
  validateStatus(context, status)
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

export async function adapterDelete({ adapter, hooks }, status, options) {
  if (hooks.beforeDelete) {
    await hooks.beforeDelete(status.source, options)
  }
  await adapter.delete(status.source, options)
  if (hooks.afterDelete) {
    await hooks.afterDelete(status.source, options)
  }
  return commitStatus(status)
}

export async function adapterWrite(context, status, options) {
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

export async function* sequentialWrite(context, iterable, options) {
  for await (const status of iterable) {
    yield adapterWrite(context, status, options)
  }
}

function commitBulkStatus(action, status, result) {
  if (action.type === 'CREATE') {
    status = updateStatus(status, result)
  } else if (action.type === 'UPDATE') {
    status = updateStatus(
      status,
      writeConstants(result, readConstants(status.target))
    )
  }
  return commitStatus(status)
}

function commitBulkItem(item, result) {
  const action = item.action
  const oldStatus = item.status
  const newStatus = commitBulkStatus(action, oldStatus, result)

  if (action.type === 'CREATE') {
    return {
      action: {
        type: 'CREATE',
        data: newStatus.target
      },
      status: newStatus
    }
  } else if (action.type === 'UPDATE') {
    return {
      action: {
        type: 'UPDATE',
        oldData: oldStatus.source,
        newData: newStatus.target
      },
      status: newStatus
    }
  } else {
    return {
      action,
      status: newStatus
    }
  }
}

async function* flushBulkItems(context, items, options) {
  if (items.length === 1) {
    yield adapterWrite(context, items[0].status, options)
    return
  }

  const { adapter, hooks, intent, store } = context

  if (hooks.beforeBulk) {
    await hooks.beforeBulk(
      items.map(item => item.action),
      options
    )
  }

  const results = await adapter.bulk(
    items.map(item => item.action),
    options
  )

  if (results) {
    if (!Array.isArray(results)) {
      throw new MutentError('EMUT_INVALID_BULK_WRITE', 'Expected array', {
        intent,
        output: results,
        store
      })
    }
    if (results.length !== items.length) {
      throw new MutentError(
        'EMUT_INVALID_BULK_WRITE',
        'Array length mismatch',
        {
          intent,
          output: results,
          store
        }
      )
    }
    items = items.map((item, i) => commitBulkItem(item, results[i]))
  } else {
    items = items.map(({ action, status }) => ({
      action,
      status: commitStatus(status)
    }))
  }

  if (hooks.afterBulk) {
    await hooks.afterBulk(
      items.map(item => item.action),
      options
    )
  }

  for (const { status } of items) {
    yield status
  }
}

export async function* bulkWrite(context, iterable, options) {
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

  let items = []

  const mutentOptions = options.mutent || {}
  const size = mutentOptions.writeSize || context.writeSize || 16

  for await (const status of iterable) {
    const mustCreate = shouldCreate(status, context)
    const mustUpdate = shouldUpdate(status, context)
    const mustDelete = shouldDelete(status)

    if (mustCreate) {
      validateStatus(context, status)
      items.push({
        action: {
          type: 'CREATE',
          data: status.target
        },
        status
      })
    } else if (mustUpdate) {
      validateStatus(context, status)
      validateConstants(context, status)
      items.push({
        action: {
          type: 'UPDATE',
          oldData: status.source,
          newData: status.target
        },
        status
      })
    } else if (mustDelete) {
      items.push({
        action: {
          type: 'DELETE',
          data: status.source
        },
        status
      })
    }

    // True when the status is already committed
    const mustIgnore = !mustCreate && !mustUpdate && !mustDelete

    // Keep statuses order when mustIgnore is true
    if (items.length > 0 && (mustIgnore || items.length >= size)) {
      for await (const status of flushBulkItems(context, items, options)) {
        yield status
      }
      items = []
    }

    if (mustIgnore) {
      yield commitStatus(status)
    }
  }

  if (items.length > 0) {
    for await (const status of flushBulkItems(context, items, options)) {
      yield status
    }
  }
}
