import { MutentError } from './error'
import { commitStatus, updateStatus } from './status'

function valid() {
  return true
}

function findMethod(query, options) {
  const { adapter, hooks } = this
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

function filterMethod(query, options) {
  const { adapter, hooks } = this
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

async function createMethod(data, options) {
  const { adapter, hooks, validate } = this
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

async function updateMethod(oldData, newData, options) {
  const { adapter, hooks, validate } = this
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

async function deleteMethod(data, options) {
  const { adapter, hooks } = this
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

async function writeMethod(status, options) {
  const { created, updated, deleted, source, target } = status

  let data
  if (source === null && created && !deleted) {
    data = await this.create(target, options)
  } else if (source !== null && updated && !deleted) {
    data = await this.update(source, target, options)
  } else if (source !== null && deleted) {
    data = await this.delete(source, options)
  }

  return commitStatus(
    data === null || data === undefined ? status : updateStatus(status, data)
  )
}

export function createDriver(adapter, hooks = {}, validate = valid) {
  return {
    adapter,
    hooks,
    validate,
    find: findMethod,
    filter: filterMethod,
    create: createMethod,
    update: updateMethod,
    delete: deleteMethod,
    write: writeMethod
  }
}
