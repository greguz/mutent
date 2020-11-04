import fluente from 'fluente'
import Herry from 'herry'

import { writeStatus } from './driver/writer'
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
import { iterateMany, iterateOne, unwrapMany, unwrapOne } from './producers'
import { createStatus, readStatus, shouldCommit } from './status'
import { mutateStatus } from './tree'
import { coalesce, isNil, isNull, unlazy } from './utils'

async function unwrapStatus(status, { schema, settings, tree }, options) {
  if (isNull(status.target)) {
    return null
  }
  const { driver, migrationStrategies, prepare, versionKey } = settings

  // Initialize status
  if (status.created && prepare) {
    const out = prepare(status.target, options)
    if (!isNil(out)) {
      status.target = out
    }
  }

  // Apply migration strategies
  if (migrationStrategies) {
    status = await migrateStatus(status, migrationStrategies, versionKey)
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
    const manualCommit = coalesce(options.manualCommit, settings.manualCommit)
    const unsafe = coalesce(options.unsafe, settings.unsafe)

    if (!manualCommit) {
      status = await writeStatus(status, driver, options)
    } else if (!unsafe) {
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
  const { input, toPromise, toStatus } = state
  return toPromise(unlazy(input, options), data =>
    unwrapStatus(toStatus(data), state, options)
  )
}

function iterateMethod(state, options = {}) {
  const { input, toIterable, toStatus } = state
  return toIterable(unlazy(input, options), data =>
    unwrapStatus(toStatus(data), state, options)
  )
}

function createInstance(
  input,
  toStatus,
  toPromise,
  toIterable,
  schema,
  settings = {}
) {
  const state = {
    input,
    schema,
    settings,
    toIterable,
    toPromise,
    toStatus,
    tree: []
  }

  return fluente({
    historySize: settings.historySize,
    isMutable: settings.classy,
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

export function createEntity(one, settings, schema) {
  return createInstance(
    one,
    createStatus,
    unwrapOne,
    iterateOne,
    schema,
    settings
  )
}

export function readEntity(one, settings, schema) {
  return createInstance(
    one,
    readStatus,
    unwrapOne,
    iterateOne,
    schema,
    settings
  )
}

export function createEntities(many, settings, schema) {
  return createInstance(
    many,
    createStatus,
    unwrapMany,
    iterateMany,
    schema,
    settings
  )
}

export function readEntities(many, settings, schema) {
  return createInstance(
    many,
    readStatus,
    unwrapMany,
    iterateMany,
    schema,
    settings
  )
}
