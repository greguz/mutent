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

async function doCreate({ adapter, hooks, validate }, data, options) {
  if (!adapter.create) {
    throw new MutentError(
      'EMUT_PARTIAL_ADAPTER',
      'The adapter does not implement the ".create" method'
    )
  }
  if (!validate(data)) {
    throw new MutentError(
      'EMUT_INVALID_WRITE',
      'Cannot create an invalid entity',
      {
        data,
        errors: validate.errors
      }
    )
  }
  if (hooks.beforeCreate) {
    await hooks.beforeCreate(data, options)
  }
  const result = await adapter.create(data, options)
  if (hooks.afterCreate) {
    await hooks.afterCreate(data, options)
  }
  return result
}

async function doUpdate(
  { adapter, hooks, validate },
  oldData,
  newData,
  options
) {
  if (!adapter.update) {
    throw new MutentError(
      'EMUT_PARTIAL_ADAPTER',
      'The adapter does not implement the ".update" method'
    )
  }
  if (!validate(newData)) {
    throw new MutentError(
      'EMUT_INVALID_WRITE',
      'Cannot update an entity with an invalid value',
      {
        data: newData,
        errors: validate.errors
      }
    )
  }
  if (hooks.beforeUpdate) {
    await hooks.beforeUpdate(oldData, newData, options)
  }
  const result = await adapter.update(oldData, newData, options)
  if (hooks.afterUpdate) {
    await hooks.afterUpdate(oldData, newData, options)
  }
  return result
}

async function doDelete({ adapter, hooks }, data, options) {
  if (!adapter.delete) {
    throw new MutentError(
      'EMUT_PARTIAL_ADAPTER',
      'The adapter does not implement the ".delete" method'
    )
  }
  if (hooks.beforeDelete) {
    await hooks.beforeDelete(data, options)
  }
  const result = await adapter.delete(data, options)
  if (hooks.afterDelete) {
    await hooks.afterDelete(data, options)
  }
  return result
}

export async function doCommit(driver, status, options) {
  const { created, updated, deleted, source, target } = status

  let data
  if (source === null && created && !deleted) {
    data = await doCreate(driver, target, options)
  } else if (source !== null && updated && !deleted) {
    data = await doUpdate(driver, source, target, options)
  } else if (source !== null && deleted) {
    data = await doDelete(driver, source, options)
  }

  return commitStatus(
    data === null || data === undefined ? status : updateStatus(status, data)
  )
}

function yes() {
  return true
}

export function createDriver(adapter, hooks = {}, validate = yes) {
  return {
    adapter,
    hooks,
    validate
  }
}
