import stream from 'stream'
import fluente from 'fluente'

import { Many, One, StreamOptions, UnwrapOptions } from './data'
import { Condition, Mapper, Mutation, MutationSettings, createMutation } from './mutation'
import { objectify } from './utils'

import { streamMany, unwrapMany } from './entities'
import { streamOne, unwrapOne } from './entity'

export interface Instance<T, U, O> {
  mutate (mutation: Mutation<T, O>): Instance<T, U, O>
  update<A extends any[]> (mapper: Mapper<T, A>, ...args: A): Instance<T, U, O>
  assign (object: Partial<T>): Instance<T, U, O>
  delete (): Instance<T, U, O>
  commit (): Instance<T, U, O>
  if (condition: Condition<T>): Instance<T, U, O>
  elseIf (condition: Condition<T>): Instance<T, U, O>
  else (): Instance<T, U, O>
  endIf (): Instance<T, U, O>
  unwrap (options?: UnwrapOptions<O>): Promise<U>
  stream (options?: StreamOptions<O>): stream.Readable
  createMutation (settings?: MutationSettings<T, O>): Mutation<T, O>
  undo (steps?: number): Instance<T, U, O>
  redo (steps?: number): Instance<T, U, O>
}

export type Entity<T, O = any> = Instance<T, T, O>

export type Entities<T, O = any> = Instance<T, T[], O>

type Unwrapper<T, U, O> = (
  mutation: Mutation<T, O>,
  options: UnwrapOptions<O>
) => Promise<U>

type Streamer<T, O> = (
  mutation: Mutation<T, O>,
  options: StreamOptions<O>
) => stream.Readable

interface State<T, U, O> {
  mutation: Mutation<T>
  settings: MutationSettings<T, O>
  stream: Streamer<T, O>
  unwrap: Unwrapper<T, U, O>
}

function mutateState<T, U, O> (
  state: State<T, U, O>,
  procedure: (mutation: Mutation<T, O>) => Mutation<T, O>
): State<T, U, O> {
  return {
    ...state,
    mutation: procedure(state.mutation)
  }
}

function mutateMethod<T, U, O> (
  state: State<T, U, O>,
  newMutation: Mutation<T, O>
): State<T, U, O> {
  return mutateState(state, oldMutation => oldMutation.mutate(newMutation))
}

function updateMethod<T, U, O, A extends any[]> (
  state: State<T, U, O>,
  mapper: Mapper<T, A>,
  ...args: A
): State<T, U, O> {
  return mutateState(state, mutation => mutation.update(mapper, ...args))
}

function assignMethod<T, I, U, O> (
  state: State<T, U, O>,
  object: Partial<T>
): State<T, U, O> {
  return mutateState(state, mutation => mutation.assign(object))
}

function deleteMethod<T, I, U, O> (
  state: State<T, U, O>
): State<T, U, O> {
  return mutateState(state, mutation => mutation.delete())
}

function commitMethod<T, U, O> (
  state: State<T, U, O>
): State<T, U, O> {
  return mutateState(state, mutation => mutation.commit())
}

function ifMethod<T, U, O> (
  state: State<T, U, O>,
  condition: Condition<T>
): State<T, U, O> {
  return mutateState(state, mutation => mutation.if(condition))
}

function elseIfMethod<T, U, O> (
  state: State<T, U, O>,
  condition: Condition<T>
): State<T, U, O> {
  return mutateState(state, mutation => mutation.elseIf(condition))
}

function elseMethod<T, U, O> (
  state: State<T, U, O>
): State<T, U, O> {
  return mutateState(state, mutation => mutation.else())
}

function endIfMethod<T, U, O> (
  state: State<T, U, O>
): State<T, U, O> {
  return mutateState(state, mutation => mutation.endIf())
}

async function unwrapMethod<T, I, U, O> (
  state: State<T, U, O>,
  options?: UnwrapOptions<O>
): Promise<U> {
  return state.unwrap(state.mutation, objectify(options))
}

function streamMethod<T, U, O> (
  state: State<T, U, O>,
  options?: StreamOptions<O>
): stream.Readable {
  return state.stream(state.mutation, objectify(options))
}

function createMutationMethod<T, I, U, O> (
  state: State<T, U, O>,
  custom?: MutationSettings<T, O>
): Mutation<T, O> {
  return createMutation({ ...state.settings, ...custom })
}

function createInstance<T, U, O> (
  unwrap: Unwrapper<T, U, O>,
  stream: Streamer<T, O>,
  settings: MutationSettings<T, O>
): Instance<T, U, O> {
  const state: State<T, U, O> = {
    mutation: createMutation({
      autoCommit: settings.autoCommit,
      classy: false,
      historySize: 0,
      safe: settings.safe,
      writer: settings.writer
    }),
    settings,
    stream,
    unwrap
  }
  return fluente({
    historySize: settings.historySize,
    isMutable: settings.classy === true,
    state,
    fluent: {
      mutate: mutateMethod,
      update: updateMethod,
      assign: assignMethod,
      delete: deleteMethod,
      commit: commitMethod,
      if: ifMethod,
      elseIf: elseIfMethod,
      else: elseMethod,
      endIf: endIfMethod
    },
    methods: {
      unwrap: unwrapMethod,
      stream: streamMethod,
      createMutation: createMutationMethod
    }
  })
}

export function createEntity<T, O = any> (
  one: One<T, O>,
  settings: MutationSettings<T, O> = {}
): Entity<T, O> {
  return createInstance(
    (mutation, options) => unwrapOne(one, false, mutation, options),
    (mutation, options) => streamOne(one, false, mutation, options),
    settings
  )
}

export function readEntity<T, O = any> (
  one: One<T, O>,
  settings: MutationSettings<T, O> = {}
): Entity<T, O> {
  return createInstance(
    (mutation, options) => unwrapOne(one, true, mutation, options),
    (mutation, options) => streamOne(one, true, mutation, options),
    settings
  )
}

export function createEntities<T, O = any> (
  many: Many<T, O>,
  settings: MutationSettings<T, O> = {}
): Entities<T, O> {
  return createInstance(
    (mutation, options) => unwrapMany(many, false, mutation, options),
    (mutation, options) => streamMany(many, false, mutation, options),
    settings
  )
}

export function readEntities<T, O = any> (
  many: Many<T, O>,
  settings: MutationSettings<T, O> = {}
): Entities<T, O> {
  return createInstance(
    (mutation, options) => unwrapMany(many, true, mutation, options),
    (mutation, options) => streamMany(many, true, mutation, options),
    settings
  )
}
