import fluente from 'fluente'
import Herry from 'herry'

import { writeStatus } from './adapter'
import { mutateStatus } from './ast'
import { isCreationIntent, isIntentIterable, unwrapIntent } from './intent'
import { migrateStatus } from './migration'
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
import { coalesce, isFunction, isNil, isNull } from './utils'

function toStatus(intent, data) {
  return isCreationIntent(intent) ? createStatus(data) : readStatus(data)
}

async function processData(
  data,
  { adapter, intent, manualCommit, migration, prepare, schema, tree, unsafe },
  options
) {
  if (isNull(data)) {
    return null
  }

  // Initialize status
  let status = toStatus(intent, data)

  // Prepare object (creation time)
  if (status.created && prepare) {
    const out = prepare(status.target, options)
    if (!isNil(out)) {
      status.target = out
    }
  }

  // Apply migration strategies
  if (migration) {
    status = await migrateStatus(migration, status)
  }

  // First validation and parsing
  if (schema) {
    status.target = schema.parse(
      status.target,
      'EMUT_INVALID_DATA',
      'Unusable data found'
    )
  }

  // Apply mutations and validate
  if (tree.length > 0) {
    status = await mutateStatus(status, tree, adapter, options)
    if (schema) {
      schema.validate(
        status.target,
        'EMUT_INVALID_MUTATION',
        'A mutation has generated an invalid output'
      )
    }
  }

  // Handle manualCommit/unsafe features
  if (shouldCommit(status)) {
    if (!coalesce(options.manualCommit, manualCommit)) {
      status = await writeStatus(adapter, status, options)
    } else if (!coalesce(options.unsafe, unsafe)) {
      throw new Herry('EMUT_UNSAFE', 'Unsafe mutation', {
        source: status.source,
        target: status.target,
        options
      })
    }
  }

  return status.target
}

function fetch({ adapter, intent }, options) {
  return unwrapIntent(adapter, intent, options)
}

async function unwrapOne(state, options) {
  return processData(await fetch(state, options), state, options)
}

function iterateOne(state, options) {
  return {
    [Symbol.asyncIterator]: async function* () {
      const value = await unwrapOne(state, options)
      if (!isNull(value)) {
        yield value
      }
    }
  }
}

function toIterator(value) {
  if (!isNull(value) && isFunction(value[Symbol.asyncIterator])) {
    return value[Symbol.asyncIterator]()
  } else if (!isNull(value) && isFunction(value[Symbol.iterator])) {
    return value[Symbol.iterator]()
  } else {
    throw new Herry('EMUT_NOT_ITERABLE', 'Expected an iterable', { value })
  }
}

async function unwrapMany(state, options) {
  const iterator = toIterator(fetch(state, options))
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

function iterateMany(state, options) {
  return {
    [Symbol.asyncIterator]() {
      const iterator = toIterator(fetch(state, options))
      return {
        async next() {
          const { done, value } = await iterator.next()
          return {
            done,
            value: done ? undefined : await processData(value, state, options)
          }
        }
      }
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
    adapter,
    classy,
    historySize,
    manualCommit,
    migration,
    prepare,
    schema,
    unsafe
  }
) {
  const state = {
    adapter,
    intent,
    manualCommit,
    migration,
    prepare,
    schema,
    tree: [],
    unsafe
  }

  return fluente({
    historySize,
    isMutable: classy,
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
