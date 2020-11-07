import Herry from 'herry'

import { commitStatus, updateStatus } from './status'
import { isFunction, isNil } from './utils'

function call(adapter, key, a1, a2, a3) {
  const method = adapter[key]
  if (!isFunction(method)) {
    throw new Herry(
      'EMUT_EXPECTED_DRIVER_METHOD',
      `Driver ".${key}" method is required for this operation`
    )
  }
  return method.call(adapter, a1, a2, a3)
}

export async function adapterFind(adapter, query, options, required = false) {
  return call(adapter, 'find', query, options, required)
}

export async function adapterRead(adapter, query, options) {
  const data = await adapterFind(adapter, query, options, true)
  if (isNil(data)) {
    throw new Herry('EMUT_NOT_FOUND', 'Entity not found', {
      query,
      options
    })
  }
  return data
}

export function adapterFilter(adapter, query, options) {
  return call(adapter, 'filter', query, options)
}

export async function adapterCount(adapter, query, options) {
  return call(adapter, 'count', query, options)
}

export async function adapterExists(adapter, query, options) {
  if (isNil(adapter.exists) && isFunction(adapter.find)) {
    return !isNil(await adapterFind(adapter, query, options))
  } else {
    return call(adapter, 'exists', query, options)
  }
}

export async function writeStatus(adapter, status, options) {
  const { created, updated, deleted, source, target } = status

  let data
  if (isNil(source) && created && !deleted) {
    data = await call(adapter, 'create', target, options)
  } else if (!isNil(source) && updated && !deleted) {
    data = await call(adapter, 'update', source, target, options)
  } else if (!isNil(source) && deleted) {
    data = await call(adapter, 'delete', source, options)
  }

  return commitStatus(isNil(data) ? status : updateStatus(status, data))
}
