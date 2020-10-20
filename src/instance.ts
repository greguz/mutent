import stream from 'stream'
import fluente from 'fluente'
import Herry from 'herry'

import { Strategies, migrateStatus } from './migration'
import {
  Mutation,
  MutationSettings,
  MutationState,
  assignMethod,
  commitMethod,
  deleteMethod,
  ifMethod,
  mutateMethod,
  renderMethod,
  unlessMethod,
  updateMethod
} from './mutation'
import {
  Many,
  One,
  StreamOptions,
  UnwrapOptions,
  streamMany,
  streamOne,
  unwrapMany,
  unwrapOne
} from './producers'
import { Status, createStatus, readStatus, shouldCommit } from './status'
import { SchemaHandler } from './schema/index'
import { mutateStatus } from './tree'
import { isNil, isNull, isUndefined, objectify } from './utils'
import { Writer, writeStatus } from './writer'

export interface InstanceSettings<T, O = any> extends MutationSettings {
  autoCommit?: boolean
  driver?: Writer<T, O>
  migrationStrategies?: Strategies
  prepare?: (data: any, options: Partial<O>) => T | null | undefined | void
  safe?: boolean
  schemaHandler?: SchemaHandler
  versionKey?: string
}

interface Instance<T, O, U> extends Mutation<T> {
  unwrap(options?: UnwrapOptions<O>): Promise<U>
  stream(options?: StreamOptions<O>): stream.Readable
}

export interface Entity<T, O = any> extends Mutation<T> {
  unwrap(options?: UnwrapOptions<O>): Promise<T>
  stream(options?: StreamOptions<O>): stream.Readable
}

export interface Entities<T, O = any> extends Mutation<T> {
  unwrap(options?: UnwrapOptions<O>): Promise<T[]>
  stream(options?: StreamOptions<O>): stream.Readable
}

type Handler<T, O> = (data: any, options: Partial<O>) => Promise<T>

type Producer<T, O, U> = (handler: Handler<T, O>, options: O) => U

interface InstanceState<T, O, U> extends MutationState<T> {
  settings: InstanceSettings<T, O>
  toPromise: Producer<T, O, Promise<U>>
  toStatus: (data: T) => Status<T>
  toStream: Producer<T, O, stream.Readable>
}

async function unwrapState<T, O>(
  { settings, toStatus, tree }: InstanceState<T, O, any>,
  data: T,
  options: StreamOptions<O>
): Promise<T> {
  if (isNull(data)) {
    return data
  }
  const {
    driver,
    migrationStrategies,
    prepare,
    schemaHandler,
    versionKey
  } = settings

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

  // Apply JSON schema validation/parsing
  if (schemaHandler) {
    status.target = schemaHandler.compute(status.target)
  }

  // Apply mutation tree to status
  status = await mutateStatus(status, tree, driver, options)

  // Handle autoCommit/safe features
  if (driver && shouldCommit(status)) {
    const autoCommit = isUndefined(options.autoCommit)
      ? settings.autoCommit !== false
      : options.autoCommit !== false

    const safe = isUndefined(options.safe)
      ? settings.safe !== false
      : options.safe !== false

    if (autoCommit) {
      status = await writeStatus(status, driver, options)
    } else if (safe) {
      throw new Herry('EMUT_UNSAFE', 'Unsafe mutation', {
        source: status.source,
        target: status.target,
        options
      })
    }
  }

  return status.target
}

async function unwrapMethod<T, U, O>(
  state: InstanceState<T, O, U>,
  options?: UnwrapOptions<O>
): Promise<U> {
  return state.toPromise(
    (data, options) => unwrapState(state, data, options),
    objectify(options)
  )
}

function streamMethod<T, U, O>(
  state: InstanceState<T, O, U>,
  options?: StreamOptions<O>
): stream.Readable {
  return state.toStream(
    (data, options) => unwrapState(state, data, options),
    objectify(options)
  )
}

function createInstance<T, O, U>(
  toStatus: InstanceState<T, O, U>['toStatus'],
  toPromise: InstanceState<T, O, U>['toPromise'],
  toStream: InstanceState<T, O, U>['toStream'],
  settings: InstanceSettings<T, O>
): Instance<T, O, U> {
  const state: InstanceState<T, O, U> = {
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

export function createEntity<T, O = any>(
  one: One<T, O>,
  settings: InstanceSettings<T, O> = {}
): Entity<T, O> {
  return createInstance(
    createStatus,
    (handler, options) => unwrapOne(one, handler, options),
    (handler, options) => streamOne(one, handler, options),
    settings
  )
}

export function readEntity<T, O = any>(
  one: One<T, O>,
  settings: InstanceSettings<T, O> = {}
): Entity<T, O> {
  return createInstance(
    readStatus,
    (handler, options) => unwrapOne(one, handler, options),
    (handler, options) => streamOne(one, handler, options),
    settings
  )
}

export function createEntities<T, O = any>(
  many: Many<T, O>,
  settings: InstanceSettings<T, O> = {}
): Entities<T, O> {
  return createInstance(
    createStatus,
    (handler, options) => unwrapMany(many, handler, options),
    (handler, options) => streamMany(many, handler, options),
    settings
  )
}

export function readEntities<T, O = any>(
  many: Many<T, O>,
  settings: InstanceSettings<T, O> = {}
): Entities<T, O> {
  return createInstance(
    readStatus,
    (handler, options) => unwrapMany(many, handler, options),
    (handler, options) => streamMany(many, handler, options),
    settings
  )
}
