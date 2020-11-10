import { adapterFilter, adapterFind, adapterRead } from './adapter'

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

export function unwrapIntent(adapter, { data, query, type }, options) {
  switch (type) {
    case INTENT_TYPE.CREATE:
    case INTENT_TYPE.FROM:
      return data
    case INTENT_TYPE.FIND:
      return adapterFind(adapter, query, options)
    case INTENT_TYPE.READ:
      return adapterRead(adapter, query, options)
    case INTENT_TYPE.FILTER:
      return adapterFilter(adapter, query, options)
  }
}

export function describeIntent({ data, query, type }) {
  switch (type) {
    case INTENT_TYPE.CREATE:
      return { type: 'CREATE', data }
    case INTENT_TYPE.FIND:
      return { type: 'FIND', query }
    case INTENT_TYPE.READ:
      return { type: 'READ', query }
    case INTENT_TYPE.FILTER:
      return { type: 'FILTER', query }
    case INTENT_TYPE.FROM:
      return { type: 'FROM', data }
  }
}
