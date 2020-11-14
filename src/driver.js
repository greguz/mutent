import Herry from 'herry'

import { commitStatus, updateStatus } from './status'
import { isFunction, isNil } from './utils'

function hasMethod(obj, key) {
  return isFunction(obj[key])
}

function ensureMethod(obj, key) {
  if (!hasMethod(obj, key)) {
    throw new Herry(
      'EMUT_EXPECTED_ADAPTER_METHOD',
      `Adapter ".${key}" method is required for this operation`
    )
  }
}

async function triggerAsyncHook(hooks, name, a1, a2, a3) {
  const fn = hooks[name]
  if (isFunction(fn)) {
    await fn.call(hooks, a1, a2, a3)
  }
}

function triggerSyncHook(hooks, name, a1, a2) {
  const fn = hooks[name]
  if (isFunction(fn)) {
    fn.call(hooks, a1, a2)
  }
}

export function createDriver(adapter, hooks = {}) {
  return {
    adapter,
    hooks
  }
}

export function find({ adapter, hooks }, query, options) {
  ensureMethod(adapter, 'find')
  triggerSyncHook(hooks, 'onFind', query, options)
  return adapter.find(query, options)
}

export function filter({ adapter, hooks }, query, options) {
  ensureMethod(adapter, 'filter')
  triggerSyncHook(hooks, 'onFilter', query, options)
  return adapter.filter(query, options)
}

export async function write({ adapter, hooks }, status, options) {
  const { created, updated, deleted, source, target } = status

  let data
  if (isNil(source) && created && !deleted) {
    ensureMethod(adapter, 'create')
    await triggerAsyncHook(hooks, 'beforeCreate', target, options)
    data = await adapter.create(target, options)
    await triggerAsyncHook(hooks, 'afterCreate', target, options)
  } else if (!isNil(source) && updated && !deleted) {
    ensureMethod(adapter, 'update')
    await triggerAsyncHook(hooks, 'beforeUpdate', source, target, options)
    data = await adapter.update(source, target, options)
    await triggerAsyncHook(hooks, 'afterUpdate', source, target, options)
  } else if (!isNil(source) && deleted) {
    ensureMethod(adapter, 'delete')
    await triggerAsyncHook(hooks, 'beforeDelete', source, options)
    data = await adapter.delete(source, options)
    await triggerAsyncHook(hooks, 'afterDelete', source, options)
  }

  return commitStatus(isNil(data) ? status : updateStatus(status, data))
}

async function iteratorCount(iterator) {
  let active = true
  let count = 0
  while (active) {
    const { done } = await iterator.next()
    if (done) {
      active = false
    } else {
      count++
    }
  }
  return count
}

function createIterator(iterable) {
  if (iterable !== null && isFunction(iterable[Symbol.asyncIterator])) {
    return iterable[Symbol.asyncIterator]()
  } else if (iterable !== null && isFunction(iterable[Symbol.iterator])) {
    return iterable[Symbol.iterator]()
  } else {
    throw new Error('Not iterable')
  }
}

export async function count({ adapter, hooks }, query, options) {
  triggerSyncHook(hooks, 'onFilter', query, options)
  if (!hasMethod(adapter, 'count') && hasMethod(adapter, 'filter')) {
    return iteratorCount(createIterator(adapter.filter(query, options)))
  } else {
    ensureMethod(adapter, 'count')
    return adapter.count(query, options)
  }
}

async function findExists(adapter, query, options) {
  const data = await adapter.find(query, options)
  return !isNil(data)
}

export async function exists({ adapter, hooks }, query, options) {
  triggerSyncHook(hooks, 'onFind', query, options)
  if (!hasMethod(adapter, 'exists') && hasMethod(adapter, 'find')) {
    return findExists(adapter, query, options)
  } else {
    ensureMethod(adapter, 'exists')
    return adapter.exists(query, options)
  }
}
