import fluente from 'fluente'
import Herry from 'herry'

import { mutateStatus } from './ast'
import { isConstantValid, readConstants } from './constants'
import { write } from './driver'
import {
  isCreationIntent,
  isIntentIterable,
  isRequired,
  unwrapIntent
} from './intent'
import { migrateData } from './migration'
import {
  assignMethod,
  commitMethod,
  deleteMethod,
  ifMethod,
  mutateMethod,
  unlessMethod,
  updateMethod
} from './mutation'
import { createStatus, readStatus, shouldCommit } from './status'
import { coalesce, isAsyncIterable, isIterable } from './utils'

function toStatus(intent, data) {
  return isCreationIntent(intent) ? createStatus(data) : readStatus(data)
}

async function processData(
  data,
  {
    driver,
    hook,
    intent,
    manualCommit,
    migration,
    store,
    tree,
    unsafe,
    validate
  },
  options
) {
  // Check data requirement
  if (data === null || data === undefined) {
    if (isRequired(intent)) {
      throw new Herry('EMUT_NOT_FOUND', 'Entity not found', {
        store,
        intent,
        data,
        options
      })
    } else {
      return null
    }
  }

  // Trigger "onData" hook
  if (hook) {
    await hook(intent.type, data, options)
  }

  // Apply migration strategies
  if (migration) {
    data = await migrateData(migration, data)
  }

  // First validation and parsing
  if (validate && !validate(data)) {
    throw new Herry('EMUT_INVALID_DATA', 'Unusable data found', {
      store,
      intent,
      data,
      options,
      errors: validate.errors
    })
  }

  // Load initial constants
  const constants = readConstants(data)

  // Initialize status
  let status = toStatus(intent, data)

  if (tree.length > 0) {
    // Apply mutation chain
    status = await mutateStatus(status, tree, driver, options)

    // Validate post-mutation data
    if (validate && !validate(status.target)) {
      throw new Herry(
        'EMUT_INVALID_MUTATION',
        'A mutation has generated an invalid output',
        {
          store,
          intent,
          status,
          options,
          errors: validate.errors
        }
      )
    }

    // Validate constant values
    for (const constant of constants) {
      if (!isConstantValid(constant, status.target)) {
        throw new Herry('EMUT_CONSTANT', 'A constant value was changed', {
          store,
          intent,
          status,
          options,
          constant
        })
      }
    }
  }

  // Handle manualCommit/unsafe features
  if (shouldCommit(status)) {
    const mutentOptions = options.mutent || {}
    if (!coalesce(mutentOptions.manualCommit, manualCommit)) {
      status = await write(driver, status, options)
    } else if (!coalesce(mutentOptions.unsafe, unsafe)) {
      throw new Herry('EMUT_UNSAFE', 'Unsafe mutation', {
        store,
        intent,
        status,
        options
      })
    }
  }

  // Return final object
  return status.target
}

function fetch({ driver, intent }, options) {
  return unwrapIntent(driver, intent, options)
}

async function unwrapOne(state, options) {
  return processData(await fetch(state, options), state, options)
}

async function* iterateOne(state, options) {
  const value = await unwrapOne(state, options)
  if (value !== null) {
    yield value
  }
}

function createIterator(state, options) {
  const obj = fetch(state, options)
  if (isAsyncIterable(obj)) {
    return obj[Symbol.asyncIterator]()
  } else if (isIterable(obj)) {
    return obj[Symbol.iterator]()
  } else {
    throw new Herry('EMUT_NOT_ITERABLE', 'Expected an iterable', {
      store: state.store,
      intent: state.intent,
      options
    })
  }
}

async function unwrapMany(state, options) {
  const iterator = createIterator(state, options)
  const results = []

  let active = true
  while (active) {
    const { done, value } = await iterator.next()

    if (done) {
      active = false
    } else {
      results.push(await processData(value, state, options))
    }
  }

  return results
}

async function* iterateMany(state, options) {
  const iterator = createIterator(state, options)

  let active = true
  while (active) {
    const { done, value } = await iterator.next()

    if (done) {
      active = false
    } else {
      yield processData(value, state, options)
    }
  }
}

async function unwrapMethod(state, options = {}) {
  return isIntentIterable(state.intent)
    ? unwrapMany(state, options)
    : unwrapOne(state, options)
}

function iterateMethod(state, options = {}) {
  return isIntentIterable(state.intent)
    ? iterateMany(state, options)
    : iterateOne(state, options)
}

export function createInstance(
  intent,
  {
    driver,
    historySize,
    hook,
    manualCommit,
    migration,
    mutable,
    store,
    unsafe,
    validate
  }
) {
  const state = {
    driver,
    hook,
    intent,
    manualCommit,
    migration,
    store,
    tree: [],
    unsafe,
    validate
  }

  return fluente({
    historySize,
    isMutable: mutable,
    state,
    fluent: {
      update: updateMethod,
      assign: assignMethod,
      delete: deleteMethod,
      commit: commitMethod,
      if: ifMethod,
      unless: unlessMethod,
      mutate: mutateMethod
    },
    methods: {
      unwrap: unwrapMethod,
      iterate: iterateMethod
    }
  })
}
