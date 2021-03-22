import { doFilter, doFind } from './driver'

const INTENT_TYPE = {
  CREATE: 'CREATE',
  FIND: 'FIND',
  READ: 'READ',
  FILTER: 'FILTER',
  FROM: 'FROM'
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

export function isRequired({ type }) {
  return type !== INTENT_TYPE.FIND
}

export function unwrapIntent({ data, query, type }, context, options) {
  switch (type) {
    case INTENT_TYPE.CREATE:
    case INTENT_TYPE.FROM:
      return typeof data === 'function' ? data(options) : data
    case INTENT_TYPE.FIND:
    case INTENT_TYPE.READ:
      return doFind(context, query, options)
    case INTENT_TYPE.FILTER:
      return doFilter(context, query, options)
  }
}
