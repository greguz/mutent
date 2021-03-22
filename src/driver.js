import {
  isConstantValid,
  readConstants,
  writeConstants
} from './keywords/constant'
import { MutentError } from './error'
import { commitStatus, updateStatus } from './status'

export function doFind({ adapter, hooks }, query, options) {
  if (!adapter.find) {
    throw new MutentError(
      'EMUT_PARTIAL_ADAPTER',
      'The adapter does not implement the ".find" method'
    )
  }
  if (hooks.onFind) {
    hooks.onFind(query, options)
  }
  return adapter.find(query, options)
}

export function doFilter({ adapter, hooks }, query, options) {
  if (!adapter.filter) {
    throw new MutentError(
      'EMUT_PARTIAL_ADAPTER',
      'The adapter does not implement the ".filter" method'
    )
  }
  if (hooks.onFilter) {
    hooks.onFilter(query, options)
  }
  return adapter.filter(query, options)
}

async function doCreate({ adapter, hooks, validate }, status, options) {
  if (!adapter.create) {
    throw new MutentError(
      'EMUT_PARTIAL_ADAPTER',
      'The adapter does not implement the ".create" method'
    )
  }
  if (validate && !validate(status.target)) {
    throw new MutentError(
      'EMUT_INVALID_WRITE',
      'Cannot create an invalid entity',
      {
        data: status.target,
        errors: validate.errors
      }
    )
  }
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

async function doUpdate({ adapter, hooks, validate }, status, options) {
  if (!adapter.update) {
    throw new MutentError(
      'EMUT_PARTIAL_ADAPTER',
      'The adapter does not implement the ".update" method'
    )
  }
  if (validate && !validate(status.target)) {
    throw new MutentError(
      'EMUT_INVALID_WRITE',
      'Cannot update an entity with an invalid value',
      {
        data: status.target,
        errors: validate.errors
      }
    )
  }
  for (const constant of readConstants(status.source)) {
    if (!isConstantValid(constant, status.target)) {
      throw new MutentError('EMUT_CONSTANT', 'A constant value was changed', {
        data: status.target,
        constant
      })
    }
  }
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

async function doDelete({ adapter, hooks }, status, options) {
  if (!adapter.delete) {
    throw new MutentError(
      'EMUT_PARTIAL_ADAPTER',
      'The adapter does not implement the ".delete" method'
    )
  }
  if (hooks.beforeDelete) {
    await hooks.beforeDelete(status.source, options)
  }
  await adapter.delete(status.source, options)
  if (hooks.afterDelete) {
    await hooks.afterDelete(status.source, options)
  }
  return commitStatus(status)
}

export async function writeStatus(context, status, options) {
  const { created, updated, deleted, source } = status

  if (source === null && created && !deleted) {
    return doCreate(context, status, options)
  } else if (source !== null && updated && !deleted) {
    return doUpdate(context, status, options)
  } else if (source !== null && deleted) {
    return doDelete(context, status, options)
  } else {
    return commitStatus(status)
  }
}
