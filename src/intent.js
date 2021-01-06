function isAsyncIterable(obj) {
  return obj !== null && typeof obj[Symbol.asyncIterator] === 'function'
}

function isIterable(obj) {
  return obj !== null && typeof obj[Symbol.iterator] === 'function'
}

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

export function isIntentIterable({ data, type }) {
  switch (type) {
    case INTENT_TYPE.CREATE:
    case INTENT_TYPE.FROM:
      return isAsyncIterable(data) || isIterable(data)
    case INTENT_TYPE.FIND:
    case INTENT_TYPE.READ:
      return false
    case INTENT_TYPE.FILTER:
      return true
  }
}

export function unwrapIntent(driver, { data, query, type }, options) {
  switch (type) {
    case INTENT_TYPE.CREATE:
    case INTENT_TYPE.FROM:
      return data
    case INTENT_TYPE.FIND:
    case INTENT_TYPE.READ:
      return driver.find(query, options)
    case INTENT_TYPE.FILTER:
      return driver.filter(query, options)
  }
}
