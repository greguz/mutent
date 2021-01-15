import fluente from 'fluente'

import { isConstantValid, readConstants } from './constants'
import { doCommit } from './driver'
import { MutentError } from './error'
import { isCreationIntent, isRequired, unwrapIntent } from './intent'
import { migrateData } from './migration'
import { assign, commit, ddelete, iif, tap, unless, update } from './mutators'
import { createStatus, readStatus, shouldCommit } from './status'

function isAsyncIterable(value) {
  return Symbol.asyncIterator in Object(value)
}

function isIterable(value) {
  return Symbol.iterator in Object(value)
}

function coalesce(a, b) {
  return a === null || a === undefined ? b : a
}

function toStatus(intent, data) {
  return isCreationIntent(intent) ? createStatus(data) : readStatus(data)
}

async function processData(
  data,
  {
    context,
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
    status = await mutator.call(context, status, options)
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
      status = await doCommit(driver, status, options)
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

async function unwrapOne(blob, state, options) {
  const data = await blob
  if (data !== null && data !== undefined) {
    return processData(data, state, options)
  } else if (isRequired(state.intent)) {
    throw new MutentError('EMUT_NOT_FOUND', 'Entity not found', {
      store: state.store,
      intent: state.intent,
      options
    })
  } else {
    return null
  }
}

async function* iterateOne(blob, state, options) {
  const value = await unwrapOne(blob, state, options)
  if (value !== null) {
    yield value
  }
}

async function* iterateMany(blob, state, options) {
  for await (const data of blob) {
    yield processData(data, state, options)
  }
}

async function unwrapMany(blob, state, options) {
  const results = []
  for await (const data of iterateMany(blob, state, options)) {
    results.push(data)
  }
  return results
}

function unwrapMethod(state, options = {}) {
  const blob = unwrapIntent(state.intent, state.driver, options)

  return isIterable(blob) || isAsyncIterable(blob)
    ? unwrapMany(blob, state, options)
    : unwrapOne(blob, state, options)
}

function iterateMethod(state, options = {}) {
  const blob = unwrapIntent(state.intent, state.driver, options)

  return isIterable(blob) || isAsyncIterable(blob)
    ? iterateMany(blob, state, options)
    : iterateOne(blob, state, options)
}

function pipeMethod(state, ...mutators) {
  return {
    mutators: state.mutators.concat(mutators)
  }
}

function updateMethod(state, mapper, ...args) {
  return pipeMethod(
    state,
    update(args.length > 0 ? data => mapper(data, ...args) : mapper)
  )
}

function assignMethod(state, object) {
  return pipeMethod(state, assign(object))
}

function deleteMethod(state) {
  return pipeMethod(state, ddelete())
}

function commitMethod(state) {
  return pipeMethod(state, commit())
}

function ifMethod(state, condition, mutator) {
  return pipeMethod(state, iif(condition, mutator))
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
  return fluente({
    historySize,
    isMutable: mutable,
    state: {
      context: {
        write: (status, options) => doCommit(driver, status, options)
      },
      driver,
      hook,
      intent,
      manualCommit,
      migration,
      mutators: [],
      store,
      unsafe,
      validate
    },
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
