import fluente from 'fluente'

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

async function processData(
  data,
  { close, context, intent, mutators },
  options
) {
  let status = isCreationIntent(intent) ? createStatus(data) : readStatus(data)

  for (const mutator of mutators) {
    status = await mutator.call(context, status, options)
  }

  status = await close.call(context, status, options)

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
  const mutators = []

  if (hook) {
    mutators.push(async function hookMutator(status, options) {
      await hook(intent.type, status.target, options)
      return status
    })
  }

  if (migration) {
    mutators.push(async function migrateMutator(status) {
      return {
        ...status,
        target: await migrateData(migration, status.target)
      }
    })
  }

  if (validate) {
    mutators.push(async function schemaMutator(status, options) {
      if (!validate(status.target)) {
        throw new MutentError('EMUT_INVALID_DATA', 'Unusable data found', {
          store,
          intent,
          data: status.target,
          options,
          errors: validate.errors
        })
      }
      return status
    })
  }

  const context = {
    write: (status, options) => doCommit(driver, status, options)
  }

  async function closeMutator(status, options) {
    if (shouldCommit(status)) {
      const mutentOptions = options.mutent || {}
      if (!coalesce(mutentOptions.manualCommit, manualCommit)) {
        return this.write(status, options)
      } else if (!coalesce(mutentOptions.unsafe, unsafe)) {
        throw new MutentError('EMUT_UNSAFE', 'Unsafe mutation', {
          store,
          data: status.target,
          status,
          options
        })
      }
    }
    return status
  }

  return fluente({
    historySize,
    mutable,
    state: {
      close: closeMutator,
      context,
      driver,
      intent,
      mutators
    },
    fluents: {
      update: updateMethod,
      assign: assignMethod,
      delete: deleteMethod,
      commit: commitMethod,
      if: ifMethod,
      unless: unlessMethod,
      tap: tapMethod,
      pipe: pipeMethod
    },
    mappers: {
      unwrap: unwrapMethod,
      iterate: iterateMethod
    }
  })
}
