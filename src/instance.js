import fluente from 'fluente'

import { isConstantValid, readConstants } from './constants'
import { MutentError } from './error'
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
  inspectMethod,
  mutateMethod,
  mutateStatus,
  unlessMethod,
  updateMethod
} from './mutation'
import { createStatus, readStatus, shouldCommit } from './status'
import { coalesce } from './utils'

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
      throw new MutentError('EMUT_NOT_FOUND', 'Entity not found', {
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
    throw new MutentError('EMUT_INVALID_DATA', 'Unusable data found', {
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
    status = await mutateStatus(tree, status, options, { driver })

    // Validate constant values
    for (const constant of constants) {
      if (!isConstantValid(constant, status.target)) {
        throw new MutentError('EMUT_CONSTANT', 'A constant value was changed', {
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
      status = await driver.write(status, options)
    } else if (!coalesce(mutentOptions.unsafe, unsafe)) {
      throw new MutentError('EMUT_UNSAFE', 'Unsafe mutation', {
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

async function* iterateMany(state, options) {
  for await (const data of fetch(state, options)) {
    yield processData(data, state, options)
  }
}

async function unwrapMany(state, options) {
  const results = []
  for await (const data of iterateMany(state, options)) {
    results.push(data)
  }
  return results
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
      inspect: inspectMethod,
      mutate: mutateMethod
    },
    methods: {
      unwrap: unwrapMethod,
      iterate: iterateMethod
    }
  })
}
