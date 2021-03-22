import fluente from 'fluente'

import { writeStatus } from './driver'
import { MutentError } from './error'
import { isCreationIntent, isRequired, unwrapIntent } from './intent'
import { migrateData } from './migration'
import { assign, commit, ddelete, filter, iif, tap, update } from './mutators'
import { createStatus, readStatus, shouldCommit } from './status'

function isAsyncIterable(value) {
  return Symbol.asyncIterator in Object(value)
}

function isIterable(value) {
  return Symbol.iterator in Object(value)
}

async function* fromPromise(blob) {
  const data = await blob
  if (data !== null && data !== undefined) {
    yield data
  }
}

async function* iterateNewData(iterable) {
  for await (const data of iterable) {
    yield createStatus(data)
  }
}

async function* iterateOldData(iterable) {
  for await (const data of iterable) {
    yield readStatus(data)
  }
}

async function* iterateMany(blob, { context, intent, mutators }, options) {
  const iterable = mutators.reduce(
    (accumulator, mutator) => mutator.call(context, accumulator, options),
    isCreationIntent(intent) ? iterateNewData(blob) : iterateOldData(blob)
  )

  for await (const status of mutatorClose.call(context, iterable, options)) {
    yield status.target
  }
}

async function* iterateOne(blob, state, options) {
  const { intent, store } = state
  let count = 0
  for await (const data of iterateMany(fromPromise(blob), state, options)) {
    if (count++ > 0) {
      throw new Error('This is bad')
    }
    yield data
  }
  if (count <= 0 && isRequired(intent)) {
    throw new MutentError('EMUT_NOT_FOUND', 'Entity not found', {
      store,
      intent,
      options
    })
  }
}

async function unwrapMany(blob, state, options) {
  const results = []
  for await (const data of iterateMany(blob, state, options)) {
    results.push(data)
  }
  return results
}

async function unwrapOne(blob, state, options) {
  let result = null
  for await (const item of iterateOne(blob, state, options)) {
    result = item
  }
  return result
}

function unwrapMethod(state, options = {}) {
  const blob = unwrapIntent(state.intent, state.context, options)

  return isIterable(blob) || isAsyncIterable(blob)
    ? unwrapMany(blob, state, options)
    : unwrapOne(blob, state, options)
}

function iterateMethod(state, options = {}) {
  const blob = unwrapIntent(state.intent, state.context, options)

  return isIterable(blob) || isAsyncIterable(blob)
    ? iterateMany(blob, state, options)
    : iterateOne(blob, state, options)
}

function pipeMethod(state, ...mutators) {
  return {
    mutators: state.mutators.concat(mutators)
  }
}

function updateMethod(state, mapper) {
  return pipeMethod(state, update(mapper))
}

function assignMethod(state, ...objects) {
  return pipeMethod(state, assign(...objects))
}

function deleteMethod(state) {
  return pipeMethod(state, ddelete())
}

function commitMethod(state) {
  return pipeMethod(state, commit())
}

function ifMethod(state, condition, whenTrue, whenFalse) {
  return pipeMethod(state, iif(condition, whenTrue, whenFalse))
}

function tapMethod(state, callback) {
  return pipeMethod(state, tap(callback))
}

function filterMethod(state, predicate) {
  return pipeMethod(state, filter(predicate))
}

async function* mutatorClose(iterable, options) {
  const mode =
    options.mutent && options.mutent.mode ? options.mutent.mode : this.mode

  for await (let status of iterable) {
    if (shouldCommit(status)) {
      if (mode === 'AUTO') {
        status = await writeStatus(this, status, options)
      } else if (mode === 'SAFE') {
        throw new MutentError('EMUT_UNSAFE', 'Unsafe mutation', {
          store: this.store,
          data: status.target,
          options
        })
      } else if (mode !== 'MANUAL') {
        throw new Error('Unknown mode')
      }
    }
    yield status
  }
}

export function createInstance(
  intent,
  { context, historySize, migration, mutable }
) {
  const { hooks, validate } = context
  const mutators = []

  if (hooks.onData) {
    mutators.push(async function* mutatorHook(iterable, options) {
      for await (const status of iterable) {
        await hooks.onData(intent.type, status.target, options)
        yield status
      }
    })
  }

  if (migration) {
    mutators.push(async function* mutatorMigration(iterable, options) {
      for await (const status of iterable) {
        yield {
          ...status,
          target: await migrateData(migration, status.target)
        }
      }
    })
  }

  if (validate) {
    mutators.push(async function* mutatorSchema(iterable, options) {
      for await (const status of iterable) {
        if (!validate(status.target)) {
          throw new MutentError('EMUT_INVALID_DATA', 'Unusable data found', {
            store: this.store,
            intent,
            data: status.target,
            options,
            errors: validate.errors
          })
        }
        yield status
      }
    })
  }

  return fluente({
    historySize,
    mutable,
    state: {
      context,
      intent,
      mutators
    },
    fluents: {
      update: updateMethod,
      assign: assignMethod,
      delete: deleteMethod,
      commit: commitMethod,
      if: ifMethod,
      tap: tapMethod,
      pipe: pipeMethod,
      filter: filterMethod
    },
    mappers: {
      unwrap: unwrapMethod,
      iterate: iterateMethod
    }
  })
}
