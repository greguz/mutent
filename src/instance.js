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
  renderMethod,
  unlessMethod,
  updateMethod
} from './mutation'
import { streamMany, streamOne, unwrapMany, unwrapOne } from './producers'
import { createStatus, readStatus, shouldCommit } from './status'
import { mutateStatus } from './tree'
import { isNil, isNull, isUndefined, unlazy } from './utils'

async function unwrapState(
  { schema, settings, toStatus, tree },
  data,
  options
) {
  if (isNull(data)) {
    return data
  }
  const { driver, migrationStrategies, prepare, versionKey } = settings

  // Initialize status
  let status = toStatus(data)
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

  // Apply JSON schema validation/parsing (before any mutation)
  if (schema) {
    status.target = schema.compute(status.target)
  }

  // Apply mutations
  if (tree.length > 0) {
    status = await mutateStatus(status, tree, driver, options)

    // Apply JSON schema validation/parsing (post mutations)
    if (schema) {
      status.target = schema.compute(status.target)
    }
  }

  // Handle manualCommit/unsafe features
  if (driver && shouldCommit(status)) {
    const manualCommit = isUndefined(options.manualCommit)
      ? settings.manualCommit === true
      : options.manualCommit === true

    const unsafe = isUndefined(options.unsafe)
      ? settings.unsafe === true
      : options.unsafe === true

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
  return state.toPromise(data => unwrapState(state, data, options), options)
}

function streamMethod(state, options = {}) {
  return state.toStream(data => unwrapState(state, data, options), options)
}

function createInstance(toStatus, toPromise, toStream, settings = {}, schema) {
  const state = {
    schema,
    settings,
    toPromise,
    toStatus,
    toStream,
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
      render: renderMethod,
      unwrap: unwrapMethod,
      stream: streamMethod
    },
    constants: {}
  })
}

export function createEntity(one, settings, schema) {
  return createInstance(
    createStatus,
    (mutate, options) => unwrapOne(unlazy(one, options), mutate),
    (mutate, options) => streamOne(unlazy(one, options), mutate),
    settings,
    schema
  )
}

export function readEntity(one, settings, schema) {
  return createInstance(
    readStatus,
    (mutate, options) => unwrapOne(unlazy(one, options), mutate),
    (mutate, options) => streamOne(unlazy(one, options), mutate),
    settings,
    schema
  )
}

export function createEntities(many, settings, schema) {
  return createInstance(
    createStatus,
    (mutate, options) => unwrapMany(unlazy(many, options), mutate),
    (mutate, options) => streamMany(unlazy(many, options), mutate, options),
    settings,
    schema
  )
}

export function readEntities(many, settings, schema) {
  return createInstance(
    readStatus,
    (mutate, options) => unwrapMany(unlazy(many, options), mutate),
    (mutate, options) => streamMany(unlazy(many, options), mutate, options),
    settings,
    schema
  )
}
