import stream from 'stream'
import fluente from 'fluente'
import {
  Readable,
  Transform,
  Writable,
  isReadable,
  pipeline,
  readify
} from 'fluido'
import Herry from 'herry'
import Ajv from 'ajv'

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
import { Status, createStatus, readStatus, shouldCommit } from './status'
import { MutentSchema, ParseFunctions, parseValues } from './schema/index'
import { MutationTree, mutateStatus } from './tree'
import { Lazy, isNull, isUndefined, objectify, unlazy } from './utils'
import { Writer, writeStatus } from './writer'

export type Value<T> = Promise<T> | T

export type Values<T> = Iterable<T> | AsyncIterable<T> | stream.Readable

export type One<T, O = any> = Lazy<Value<T>, StreamOptions<O>>

export type Many<T, O = any> = Lazy<Values<T>, StreamOptions<O>>

export type UnwrapOptions<O = {}> = Partial<O> & {
  autoCommit?: boolean
  safe?: boolean
}

export type StreamOptions<O = {}> = UnwrapOptions<O> & {
  concurrency?: number
  highWaterMark?: number
}

export interface InstanceSettings<T, O = any> extends MutationSettings {
  autoCommit?: boolean
  driver?: Writer<T, O>
  migration?: Strategies
  parse?: ParseFunctions
  safe?: boolean
  schema?: MutentSchema
  validate?: Ajv.ValidateFunction
  versionKey?: string
}

interface Instance<T, U, O> extends Mutation<T> {
  unwrap (options?: UnwrapOptions<O>): Promise<U>
  stream (options?: StreamOptions<O>): stream.Readable
}

export interface Entity<T, O = any> extends Mutation<T> {
  unwrap (options?: UnwrapOptions<O>): Promise<T>
  stream (options?: StreamOptions<O>): stream.Readable
}

export interface Entities<T, O = any> extends Mutation<T> {
  unwrap (options?: UnwrapOptions<O>): Promise<T[]>
  stream (options?: StreamOptions<O>): stream.Readable
}

type Unwrapper<T, U, O> = (
  tree: MutationTree<T>,
  options: UnwrapOptions<O>
) => Promise<U>

type Streamer<T, O> = (
  tree: MutationTree<T>,
  options: StreamOptions<O>
) => stream.Readable

interface InstanceState<T, U, O> extends MutationState<T> {
  stream: Streamer<T, O>
  unwrap: Unwrapper<T, U, O>
}

async function unwrapStatus<T, O> (
  status: Status<T>,
  tree: MutationTree<T>,
  settings: InstanceSettings<T, O>,
  options: UnwrapOptions<O>
): Promise<T> {
  // Skip everything when "null entity"
  if (isNull(status.target)) {
    return status.target
  }
  const { driver, migration, parse, schema, validate, versionKey } = settings

  // Apply migration strategies
  if (migration) {
    status = await migrateStatus(status, migration, versionKey)
  }

  // Validate data with JSON schema
  if (validate) {
    if (!validate(status.target)) {
      throw new Herry(
        'EMUT_INVALID_DATA',
        'Invalid data detected',
        { errors: validate.errors }
      )
    }
  }

  // Apply schema parsing
  if (schema) {
    status.target = parseValues(status.target, schema, parse)
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

async function unwrapOne<T, O> (
  one: One<T, O>,
  build: (data: T) => Status<T>,
  tree: MutationTree<T>,
  settings: InstanceSettings<T, O>,
  options: UnwrapOptions<O>
): Promise<T> {
  const data = await unlazy(one, options)
  return unwrapStatus(build(data), tree, settings, options)
}

function streamOne<T, O> (
  one: One<T, O>,
  build: (data: T) => Status<T>,
  tree: MutationTree<T>,
  settings: InstanceSettings<T, O>,
  options: StreamOptions<O>
): stream.Readable {
  return new Readable({
    objectMode: true,
    async asyncRead () {
      const data = await unlazy(one, options)
      const out = await unwrapStatus(build(data), tree, settings, options)
      if (!isNull(out)) {
        this.push(out)
      }
      this.push(null)
    }
  })
}

function toStream<T> (values: Values<T>): stream.Readable {
  return isReadable(values) ? values : Readable.from(values)
}

function unwrapMany<T, O> (
  many: Many<T, O>,
  build: (data: T) => Status<T>,
  tree: MutationTree<T>,
  settings: InstanceSettings<T, O>,
  options: UnwrapOptions<O>
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const results: T[] = []
    pipeline(
      toStream(unlazy(many, options)),
      new Writable<T>({
        objectMode: true,
        async write (chunk) {
          results.push(
            await unwrapStatus(build(chunk), tree, settings, options)
          )
        }
      }),
      err => {
        if (err) {
          reject(err)
        } else {
          resolve(results)
        }
      }
    )
  })
}

function streamMany<T, O> (
  many: Many<T, O>,
  build: (data: T) => Status<T>,
  tree: MutationTree<T>,
  settings: InstanceSettings<T, O>,
  options: StreamOptions<O>
): stream.Readable {
  return readify(
    {
      highWaterMark: options.highWaterMark,
      objectMode: true
    },
    toStream(unlazy(many, options)),
    new Transform<T, T>({
      concurrency: options.concurrency,
      highWaterMark: options.highWaterMark,
      objectMode: true,
      async transform (chunk) {
        this.push(
          await unwrapStatus(build(chunk), tree, settings, options)
        )
      }
    })
  )
}

async function unwrapMethod<T, U, O> (
  state: InstanceState<T, U, O>,
  options?: UnwrapOptions<O>
): Promise<U> {
  return state.unwrap(state.tree, objectify(options))
}

function streamMethod<T, U, O> (
  state: InstanceState<T, U, O>,
  options?: StreamOptions<O>
): stream.Readable {
  return state.stream(state.tree, objectify(options))
}

function createInstance<T, U, O> (
  unwrap: Unwrapper<T, U, O>,
  stream: Streamer<T, O>,
  settings: InstanceSettings<T, O>
): Instance<T, U, O> {
  const state: InstanceState<T, U, O> = {
    stream,
    tree: [],
    unwrap
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

export function createEntity<T, O = any> (
  one: One<T, O>,
  settings: InstanceSettings<T, O> = {}
): Entity<T, O> {
  return createInstance(
    (tree, options) => unwrapOne(one, createStatus, tree, settings, options),
    (tree, options) => streamOne(one, createStatus, tree, settings, options),
    settings
  )
}

export function readEntity<T, O = any> (
  one: One<T, O>,
  settings: InstanceSettings<T, O> = {}
): Entity<T, O> {
  return createInstance(
    (tree, options) => unwrapOne(one, readStatus, tree, settings, options),
    (tree, options) => streamOne(one, readStatus, tree, settings, options),
    settings
  )
}

export function createEntities<T, O = any> (
  many: Many<T, O>,
  settings: InstanceSettings<T, O> = {}
): Entities<T, O> {
  return createInstance(
    (tree, options) => unwrapMany(many, createStatus, tree, settings, options),
    (tree, options) => streamMany(many, createStatus, tree, settings, options),
    settings
  )
}

export function readEntities<T, O = any> (
  many: Many<T, O>,
  settings: InstanceSettings<T, O> = {}
): Entities<T, O> {
  return createInstance(
    (tree, options) => unwrapMany(many, readStatus, tree, settings, options),
    (tree, options) => streamMany(many, readStatus, tree, settings, options),
    settings
  )
}
