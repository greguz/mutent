import stream from 'stream'
import fluente from 'fluente'
import Herry from 'herry'

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
import { Mutator, renderMutators } from './mutator'
import { createStatus, readStatus, shouldCommit } from './status'
import { isUndefined, objectify } from './utils'
import { handleWriter } from './writer'

export interface InstanceSettings<T, O> extends MutationSettings<T, O> {
  autoCommit?: boolean
  safe?: boolean
}

export interface Instance<T, U, O> extends Mutation<T, O> {
  unwrap (options?: UnwrapOptions<O>): Promise<U>
  stream (options?: StreamOptions<O>): stream.Readable
}

export type Entity<T, O = any> = Instance<T, T, O>

export type Entities<T, O = any> = Instance<T, T[], O>

type Unwrapper<T, U, O> = (
  mutator: Mutator<T, O>,
  options: UnwrapOptions<O>
) => Promise<U>

type Streamer<T, O> = (
  mutator: Mutator<T, O>,
  options: StreamOptions<O>
) => stream.Readable

interface InstanceState<T, U, O> extends MutationState<T, O> {
  settings: InstanceSettings<T, O>
  stream: Streamer<T, O>
  unwrap: Unwrapper<T, U, O>
}

function createSafeMutator<T, U, O> (
  state: InstanceState<T, U, O>
): Mutator<T, O> {
  const { settings } = state
  const { writer } = settings
  if (!writer) {
    return status => status
  }

  return async function safeMutator (status, options: UnwrapOptions<O>) {
    if (shouldCommit(status)) {
      const autoCommit = isUndefined(options.autoCommit)
        ? settings.autoCommit !== false
        : options.autoCommit !== false

      const safe = isUndefined(options.safe)
        ? settings.safe !== false
        : options.safe !== false

      if (autoCommit) {
        status = await handleWriter(writer, status, options)
      } else if (safe) {
        throw new Herry('EMUT_UNSAFE', 'Unsafe mutation', {
          source: status.source,
          target: status.target,
          options
        })
      }
    }

    return status
  }
}

async function unwrapMethod<T, U, O> (
  state: InstanceState<T, U, O>,
  options?: UnwrapOptions<O>
): Promise<U> {
  return state.unwrap(
    renderMutators([...state.mutators, createSafeMutator(state)]),
    objectify(options)
  )
}

function streamMethod<T, U, O> (
  state: InstanceState<T, U, O>,
  options?: StreamOptions<O>
): stream.Readable {
  return state.stream(
    renderMutators([...state.mutators, createSafeMutator(state)]),
    objectify(options)
  )
}

function createInstance<T, U, O> (
  unwrap: Unwrapper<T, U, O>,
  stream: Streamer<T, O>,
  settings: InstanceSettings<T, O>
): Instance<T, U, O> {
  const state: InstanceState<T, U, O> = {
    mutators: [],
    settings,
    stream,
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
    (mutator, options) => unwrapOne(one, createStatus, mutator, options),
    (mutator, options) => streamOne(one, createStatus, mutator, options),
    settings
  )
}

export function readEntity<T, O = any> (
  one: One<T, O>,
  settings: InstanceSettings<T, O> = {}
): Entity<T, O> {
  return createInstance(
    (mutator, options) => unwrapOne(one, readStatus, mutator, options),
    (mutator, options) => streamOne(one, readStatus, mutator, options),
    settings
  )
}

export function createEntities<T, O = any> (
  many: Many<T, O>,
  settings: InstanceSettings<T, O> = {}
): Entities<T, O> {
  return createInstance(
    (mutator, options) => unwrapMany(many, createStatus, mutator, options),
    (mutator, options) => streamMany(many, createStatus, mutator, options),
    settings
  )
}

export function readEntities<T, O = any> (
  many: Many<T, O>,
  settings: InstanceSettings<T, O> = {}
): Entities<T, O> {
  return createInstance(
    (mutator, options) => unwrapMany(many, readStatus, mutator, options),
    (mutator, options) => streamMany(many, readStatus, mutator, options),
    settings
  )
}
