import stream from 'stream'
import fluente from 'fluente'
import Herry from 'herry'

import { Value, Values, Writer, writeStatus } from './driver/index'
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
import { Options } from './options'
import { streamMany, streamOne, unwrapMany, unwrapOne } from './producers'
import { Status, createStatus, readStatus, shouldCommit } from './status'
import { SchemaHandler } from './schema/index'
import { mutateStatus } from './tree'
import { Lazy, isNil, isNull, isUndefined, unlazy } from './utils'

export type One<T, O> = Lazy<Value<T>, Options<O>>

export type Many<T, O> = Lazy<Values<T>, Options<O>>

export interface InstanceSettings<T, O> extends MutationSettings {
  autoCommit?: boolean
  driver?: Writer<T, O>
  migrationStrategies?: Strategies
  prepare?: (data: any, options: Partial<O>) => T | null | undefined | void
  safe?: boolean
  versionKey?: string
}

interface Instance<T, O, U> extends Mutation<T> {
  unwrap(options?: Options<O>): Promise<U>
  stream(options?: Options<O>): stream.Readable
}

export interface Entity<T, O> extends Mutation<T> {
  unwrap(options?: Options<O>): Promise<T>
  stream(options?: Options<O>): stream.Readable
}

export interface Entities<T, O> extends Mutation<T> {
  unwrap(options?: Options<O>): Promise<T[]>
  stream(options?: Options<O>): stream.Readable
}

type Producer<T, O, U> = (
  mutate: (data: any) => Promise<T>,
  options: Partial<O>
) => U

interface InstanceState<T, O, U> extends MutationState<T> {
  schema: SchemaHandler | undefined
  settings: InstanceSettings<T, O>
  toPromise: Producer<T, O, Promise<U>>
  toStatus: (data: T) => Status<T>
  toStream: Producer<T, O, stream.Readable>
}

async function unwrapState<T, O>(
  { schema, settings, toStatus, tree }: InstanceState<T, O, any>,
  data: T,
  options: Options<O>
): Promise<T> {
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
  options: Options<O> = {}
): Promise<U> {
  return state.toPromise(data => unwrapState(state, data, options), options)
}

function streamMethod<T, U, O>(
  state: InstanceState<T, O, U>,
  options: Options<O> = {}
): stream.Readable {
  return state.toStream(data => unwrapState(state, data, options), options)
}

function createInstance<T, O, U>(
  toStatus: InstanceState<T, O, U>['toStatus'],
  toPromise: InstanceState<T, O, U>['toPromise'],
  toStream: InstanceState<T, O, U>['toStream'],
  settings: InstanceSettings<T, O> = {},
  schema: SchemaHandler | undefined
): Instance<T, O, U> {
  const state: InstanceState<T, O, U> = {
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

export function createEntity<T, O = any>(
  one: One<T, O>,
  settings?: InstanceSettings<T, O>,
  schema?: SchemaHandler
): Entity<T, O> {
  return createInstance(
    createStatus,
    (mutate, options) => unwrapOne(unlazy(one, options), mutate),
    (mutate, options) => streamOne(unlazy(one, options), mutate),
    settings,
    schema
  )
}

export function readEntity<T, O = any>(
  one: One<T, O>,
  settings?: InstanceSettings<T, O>,
  schema?: SchemaHandler
): Entity<T, O> {
  return createInstance(
    readStatus,
    (mutate, options) => unwrapOne(unlazy(one, options), mutate),
    (mutate, options) => streamOne(unlazy(one, options), mutate),
    settings,
    schema
  )
}

export function createEntities<T, O = any>(
  many: Many<T, O>,
  settings?: InstanceSettings<T, O>,
  schema?: SchemaHandler
): Entities<T, O> {
  return createInstance(
    createStatus,
    (mutate, options) => unwrapMany(unlazy(many, options), mutate),
    (mutate, options) => streamMany(unlazy(many, options), mutate, options),
    settings,
    schema
  )
}

export function readEntities<T, O = any>(
  many: Many<T, O>,
  settings?: InstanceSettings<T, O>,
  schema?: SchemaHandler
): Entities<T, O> {
  return createInstance(
    readStatus,
    (mutate, options) => unwrapMany(unlazy(many, options), mutate),
    (mutate, options) => streamMany(unlazy(many, options), mutate, options),
    settings,
    schema
  )
}
