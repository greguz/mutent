import fluente from 'fluente'
import Herry from 'herry'

import { mutateStatus } from './ast'
import { write } from './driver'
import {
  isCreationIntent,
  isIntentIterable,
  isRequired,
  unwrapIntent
} from './intent'
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
  {
    driver,
    hook,
    intent,
    manualCommit,
    migration,
    prepare,
    store,
    tree,
    unsafe,
    validate
  },
  options
) {
  if (isNil(data)) {
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
  if (validate && !validate(status.target)) {
    throw new Herry('EMUT_INVALID_DATA', 'Unusable data found', {
      store,
      intent,
      data: status.target,
      options,
      errors: validate.errors
    })
  }

  // Trigger "onData" hook
  if (hook) {
    await hook(intent.type, status.target, options)
  }

  // Apply mutations and validate
  if (tree.length > 0) {
    status = await mutateStatus(status, tree, driver, options)
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
  }

  // Handle manualCommit/unsafe features
  if (shouldCommit(status)) {
    if (!coalesce(options.manualCommit, manualCommit)) {
      status = await write(driver, status, options)
    } else if (!coalesce(options.unsafe, unsafe)) {
      throw new Herry('EMUT_UNSAFE', 'Unsafe mutation', {
        store,
        intent,
        status,
        options
      })
    }
  }

  return status.target
}

function fetch({ driver, intent }, options) {
  return unwrapIntent(driver, intent, options)
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

function createIterator(state, options) {
  const value = fetch(state, options)
  if (!isNull(value) && isFunction(value[Symbol.asyncIterator])) {
    return value[Symbol.asyncIterator]()
  } else if (!isNull(value) && isFunction(value[Symbol.iterator])) {
    return value[Symbol.iterator]()
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

function iterateMany(state, options) {
  return {
    [Symbol.asyncIterator]() {
      const iterator = createIterator(state, options)
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
    classy,
    driver,
    historySize,
    hook,
    manualCommit,
    migration,
    prepare,
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
    prepare,
    store,
    tree: [],
    unsafe,
    validate
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
