import stream from 'stream'
import fluente from 'fluente'

import {
  Many,
  One,
  StreamOptions,
  UnwrapOptions,
  streamMany,
  streamOne,
  unwrapMany,
  unwrapOne
} from './data'
import { Strategies } from './migration'
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
import { createStatus, readStatus } from './status'
import { MutationTree } from './tree'
import { objectify } from './utils'
import { Writer } from './writer'

export interface InstanceSettings<T, O = any> extends MutationSettings {
  autoCommit?: boolean
  driver?: Writer<T, O>
  migration?: Strategies
  safe?: boolean
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
