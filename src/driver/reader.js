import Herry from 'herry'

import { isAsyncIterable, isFunction, isIterable, isNil } from '../utils'

import { DriverError } from './error'

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

async function driverRead(driver, query, options) {
  const data = await driver.find(query, options, true)
  if (isNil(data)) {
    throw new Herry('EMUT_NOT_FOUND', 'Entity not found', {
      query,
      options
    })
  }
  return data
}

export function unwrapIntent({ data, query, type }, driver, options) {
  switch (type) {
    case INTENT_TYPE.CREATE:
    case INTENT_TYPE.FROM:
      return data
    case INTENT_TYPE.FIND:
      if (!isFunction(driver.find)) {
        throw DriverError('find', { op: 'FIND', query })
      }
      return driver.find(query, options, false)
    case INTENT_TYPE.READ:
      if (!isFunction(driver.find)) {
        throw DriverError('find', { op: 'READ', query })
      }
      return driverRead(driver, query, options)
    case INTENT_TYPE.FILTER:
      if (!isFunction(driver.filter)) {
        throw DriverError('filter', { op: 'FILTER', query })
      }
      return driver.filter(query, options)
  }
}

export function isCreationIntent({ type }) {
  return type === INTENT_TYPE.CREATE
}

export function isIntentIterable({ data, type }) {
  switch (type) {
    case INTENT_TYPE.CREATE:
    case INTENT_TYPE.FROM:
      return isIterable(data) || isAsyncIterable(data)
    case INTENT_TYPE.FIND:
    case INTENT_TYPE.READ:
      return false
    case INTENT_TYPE.FILTER:
      return true
  }
}

export async function driverCount(driver, query, options) {
  if (!isFunction(driver.count)) {
    throw DriverError('count', { op: 'COUNT', query })
  }
  return driver.count(query, options)
}

export async function driverExists(driver, query, options) {
  if (isFunction(driver.exists)) {
    return driver.exists(query, options)
  } else if (isFunction(driver.find)) {
    return !isNil(await driver.find(query, options, false))
  } else {
    throw DriverError('exists', { op: 'EXISTS', query })
  }
}
