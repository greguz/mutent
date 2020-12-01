import { MutentError } from './error'
import { commitStatus, updateStatus } from './status'

function noop() {
  // nothing to do
}

function pickMethod(obj, key, def = noop) {
  const val = obj[key]
  if (typeof val === 'function') {
    return val.bind(obj)
  } else {
    return def
  }
}

function noMethod(key) {
  return function fallbackMethod() {
    throw new MutentError(
      'EMUT_PARTIAL_ADAPTER',
      `Adapter ".${key}" method is required for this operation`,
      { key }
    )
  }
}

function typeA(fn, hook) {
  return function (query, options) {
    hook(query, options)
    return fn(query, options)
  }
}

function typeB(fn, before, after, validate) {
  return async function (data, options) {
    validate(data)
    await before(data, options)
    const result = await fn(data, options)
    await after(data, options)
    return result
  }
}

function typeC(fn, before, after, validate) {
  return async function (oldData, newData, options) {
    validate(newData)
    await before(oldData, newData, options)
    const result = await fn(oldData, newData, options)
    await after(oldData, newData, options)
    return result
  }
}

function createWriteValidator(validate) {
  return function validateWrite(data) {
    if (!validate(data)) {
      throw new MutentError(
        'EMUT_INVALID_WRITE',
        'Cannot write an invalid entity',
        {
          data,
          errors: validate.errors
        }
      )
    }
  }
}

export function createDriver(adapter, hooks = {}, validate) {
  const validator = validate ? createWriteValidator(validate) : noop
  return {
    find: typeA(
      pickMethod(adapter, 'find', noMethod('find')),
      pickMethod(hooks, 'onFind')
    ),
    filter: typeA(
      pickMethod(adapter, 'filter', noMethod('filter')),
      pickMethod(hooks, 'onFilter')
    ),
    create: typeB(
      pickMethod(adapter, 'create', noMethod('create')),
      pickMethod(hooks, 'beforeCreate'),
      pickMethod(hooks, 'afterCreate'),
      validator
    ),
    update: typeC(
      pickMethod(adapter, 'update', noMethod('update')),
      pickMethod(hooks, 'beforeUpdate'),
      pickMethod(hooks, 'afterUpdate'),
      validator
    ),
    delete: typeB(
      pickMethod(adapter, 'delete', noMethod('delete')),
      pickMethod(hooks, 'beforeDelete'),
      pickMethod(hooks, 'afterDelete'),
      validator
    )
  }
}

export async function write(driver, status, options) {
  const { created, updated, deleted, source, target } = status

  let data
  if (source === null && created && !deleted) {
    data = await driver.create(target, options)
  } else if (source !== null && updated && !deleted) {
    data = await driver.update(source, target, options)
  } else if (source !== null && deleted) {
    data = await driver.delete(source, options)
  }

  return commitStatus(
    data === null || data === undefined ? status : updateStatus(status, data)
  )
}
