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
import { _delete, _if, assign, commit, tap, unless, update } from './mutators'
import { createStatus, readStatus, shouldCommit } from './status'

function coalesce(a, b) {
  return a === null || a === undefined ? b : a
}

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
    mutators,
    store,
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
  const constants = mutators.length > 0 ? readConstants(data) : []

  // Initialize status
  let status = toStatus(intent, data)

  // Apply mutation chain
  for (const mutator of mutators) {
    status = await mutator.call({ driver }, status, options)
  }

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

function pipeMethod(state, ...mutators) {
  return {
    mutators: state.mutators.concat(mutators)
  }
}

function updateMethod(state, mapper, ...args) {
  return pipeMethod(
    state,
    update(data => mapper(data, ...args))
  )
}

function assignMethod(state, object) {
  return pipeMethod(state, assign(object))
}

function deleteMethod(state) {
  return pipeMethod(state, _delete())
}

function commitMethod(state) {
  return pipeMethod(state, commit())
}

function ifMethod(state, condition, mutator) {
  return pipeMethod(state, _if(condition, mutator))
}

function unlessMethod(state, condition, mutator) {
  return pipeMethod(state, unless(condition, mutator))
}

function tapMethod(state, tapper) {
  return pipeMethod(state, tap(tapper))
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
    mutators: [],
    store,
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
      tap: tapMethod,
      pipe: pipeMethod
    },
    methods: {
      unwrap: unwrapMethod,
      iterate: iterateMethod
    }
  })
}
