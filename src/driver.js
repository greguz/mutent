import Herry from 'herry'

import { commitStatus, updateStatus } from './status'
import { isFunction, isNil } from './utils'

const INTENT_TYPE = {
  CREATE: 0,
  FIND: 1,
  READ: 2,
  FILTER: 3,
  FROM: 4
}

export function intentCreate(data) {
  return {
    type: INTENT_TYPE.CREATE,
    data
  }
}

export function intentFind(query) {
  return {
    type: INTENT_TYPE.FIND,
    query
  }
}

export function intentRead(query) {
  return {
    type: INTENT_TYPE.READ,
    query
  }
}

export function intentFilter(query) {
  return {
    type: INTENT_TYPE.FILTER,
    query
  }
}

export function intentFrom(data) {
  return {
    type: INTENT_TYPE.FROM,
    data
  }
}

export function isCreationIntent({ type }) {
  return type === INTENT_TYPE.CREATE
}

export function isIntentIterable({ data, type }) {
  switch (type) {
    case INTENT_TYPE.CREATE:
    case INTENT_TYPE.FROM:
      return Array.isArray(data)
    case INTENT_TYPE.FIND:
    case INTENT_TYPE.READ:
      return false
    case INTENT_TYPE.FILTER:
      return true
  }
}

export class Driver {
  constructor(adapter) {
    if (typeof adapter !== 'object' || adapter === null) {
      throw new Error('Expected driver')
    }
    this._adapter = adapter
  }

  async find(query, options, required = false) {
    return this._call('find', query, options, required)
  }

  async read(query, options) {
    const data = await this.find(query, options, true)
    if (isNil(data)) {
      throw new Herry('EMUT_NOT_FOUND', 'Entity not found', {
        query,
        options
      })
    }
    return data
  }

  filter(query, options) {
    return this._call('filter', query, options)
  }

  async count(query, options) {
    return this._call('count', query, options)
  }

  async exists(query, options) {
    const adapter = this._adapter
    if (isNil(adapter.exists) && isFunction(adapter.find)) {
      return !isNil(await this._call('find', query, options))
    } else {
      return this._call('exists', query, options)
    }
  }

  unwrapIntent({ data, query, type }, options) {
    switch (type) {
      case INTENT_TYPE.CREATE:
      case INTENT_TYPE.FROM:
        return data
      case INTENT_TYPE.FIND:
        return this.find(query, options)
      case INTENT_TYPE.READ:
        return this.read(query, options)
      case INTENT_TYPE.FILTER:
        return this.filter(query, options)
    }
  }

  async writeStatus(status, options) {
    const { created, updated, deleted, source, target } = status

    let data
    if (isNil(source) && created && !deleted) {
      data = await this._call('create', target, options)
    } else if (!isNil(source) && updated && !deleted) {
      data = await this._call('update', source, target, options)
    } else if (!isNil(source) && deleted) {
      data = await this._call('delete', source, options)
    }

    return commitStatus(isNil(data) ? status : updateStatus(status, data))
  }

  _call(key, a1, a2, a3) {
    const adapter = this._adapter
    const method = adapter[key]
    if (!isFunction(method)) {
      throw new Herry(
        'EMUT_EXPECTED_DRIVER_METHOD',
        `Driver ".${key}" method is required for this operation`
      )
    }
    return method.call(adapter, a1, a2, a3)
  }
}
