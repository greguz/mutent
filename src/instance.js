import fluente from 'fluente'
import Herry from 'herry'

import { mutateStatus } from './ast'
import {
  isCreationIntent,
  isIntentIterable,
  unwrapIntent
} from './driver/reader'
import { writeStatus } from './driver/writer'
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

async function unwrapOne(input, mutate) {
  return mutate(await input)
}

function iterateOne(input, mutate) {
  return {
    [Symbol.asyncIterator]: async function* () {
      const value = await unwrapOne(input, mutate)
      if (!isNull(value)) {
        yield value
      }
    }
  }
}

function createIterator(value) {
  if (!isNull(value) && isFunction(value[Symbol.asyncIterator])) {
    return value[Symbol.asyncIterator]()
  } else if (!isNull(value) && isFunction(value[Symbol.iterator])) {
    return value[Symbol.iterator]()
  } else {
    throw new Herry('EMUT_NOT_ITERABLE', 'Expected an iterable', { value })
  }
}

async function unwrapMany(input, mutate) {
  const iterator = createIterator(input)
  const results = []
  let active = true
  while (active) {
    const { done, value } = await iterator.next()
    if (done) {
      active = false
    } else {
      results.push(await mutate(value))
    }
  }
  return results
}

function iterateMany(input, mutate) {
  return {
    [Symbol.asyncIterator]() {
      return {
        iterator: createIterator(input),
        async next() {
          const { done, value } = await this.iterator.next()
          return {
            done,
            value: done ? undefined : await mutate(value)
          }
        }
      }
    }
  }
}

async function unwrapStatus(
  status,
  { driver, manualCommit, migration, prepare, schema, tree, unsafe },
  options
) {
  if (isNull(status.target)) {
    return null
  }

  // Initialize status
  if (status.created && prepare) {
    const out = prepare(status.target, options)
    if (!isNil(out)) {
      status.target = out
    }
  }

  // Apply migration strategies
  if (migration) {
    status = await migration.migrateStatus(status)
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
    status = await mutateStatus(status, tree, driver, options)
    if (schema) {
      schema.validate(
        status.target,
        'EMUT_INVALID_MUTATION',
        'A mutation has generated an invalid output'
      )
    }
  }

  // Handle manualCommit/unsafe features
  if (driver && shouldCommit(status)) {
    if (!coalesce(options.manualCommit, manualCommit)) {
      status = await writeStatus(status, driver, options)
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

async function unwrapMethod(state, options = {}) {
  const { driver, intent, toPromise, toStatus } = state
  return toPromise(unwrapIntent(intent, driver, options), data =>
    unwrapStatus(toStatus(data), state, options)
  )
}

function iterateMethod(state, options = {}) {
  const { driver, intent, toIterable, toStatus } = state
  return toIterable(unwrapIntent(intent, driver, options), data =>
    unwrapStatus(toStatus(data), state, options)
  )
}

export function createInstance(
  intent,
  {
    classy,
    driver,
    historySize,
    manualCommit,
    migration,
    prepare,
    schema,
    unsafe
  } = {}
) {
  const isIterable = isIntentIterable(intent)

  const state = {
    intent,
    driver,
    manualCommit,
    migration,
    prepare,
    schema,
    toIterable: isIterable ? iterateMany : iterateOne,
    toPromise: isIterable ? unwrapMany : unwrapOne,
    toStatus: isCreationIntent(intent) ? createStatus : readStatus,
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
