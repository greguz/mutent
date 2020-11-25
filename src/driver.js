import Herry from 'herry'

import { commitStatus, updateStatus } from './status'

function noop() {
  // nothing to do
}

function pickMethod(obj, key, def) {
  const val = obj[key]
  if (typeof val === 'function') {
    return val.bind(obj)
  } else {
    return def
  }
}

function fallback(key) {
  return function () {
    throw new Herry(
      'EMUT_EXPECTED_ADAPTER_METHOD',
      `Adapter ".${key}" method is required for this operation`
    )
  }
}

function typeA(adapter, hooks, kAdapter, kHook) {
  const fn = pickMethod(adapter, kAdapter, fallback(kAdapter))

  const hook = pickMethod(hooks, kHook, noop)
  if (hook === noop) {
    return fn
  }

  return function (query, options) {
    hook(query, options)
    return fn(query, options)
  }
}

function typeB(adapter, hooks, kAdapter, kBefore, kAfter) {
  const fn = pickMethod(adapter, kAdapter, fallback(kAdapter))

  const before = pickMethod(hooks, kBefore, noop)
  const after = pickMethod(hooks, kAfter, noop)
  if (before === noop && after === noop) {
    return fn
  }

  return async function (data, options) {
    await before(data, options)
    const result = await fn(data, options)
    await after(data, options)
    return result
  }
}

function typeC(adapter, hooks, kAdapter, kBefore, kAfter) {
  const fn = pickMethod(adapter, kAdapter, fallback(kAdapter))

  const before = pickMethod(hooks, kBefore, noop)
  const after = pickMethod(hooks, kAfter, noop)
  if (before === noop && after === noop) {
    return fn
  }

  return async function (oldData, newData, options) {
    await before(oldData, newData, options)
    const result = await fn(oldData, newData, options)
    await after(oldData, newData, options)
    return result
  }
}

export function createDriver(adapter, hooks = {}) {
  return {
    find: typeA(adapter, hooks, 'find', 'onFind'),
    filter: typeA(adapter, hooks, 'filter', 'onFilter'),
    create: typeB(adapter, hooks, 'create', 'beforeCreate', 'afterCreate'),
    update: typeC(adapter, hooks, 'update', 'beforeUpdate', 'afterUpdate'),
    delete: typeB(adapter, hooks, 'delete', 'beforeDelete', 'afterDelete')
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
