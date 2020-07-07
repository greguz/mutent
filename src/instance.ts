import stream from 'stream'
import fluente from 'fluente'

import { Many, One, StreamOptions, UnwrapOptions } from './data'
import { Condition, Mapper, Mutation, defineMutation } from './mutation'
import { createStatus, readStatus } from './status'
import { defaults, objectify } from './utils'
import { Writer } from './writer'

import { streamMany, unwrapMany } from './entities'
import { streamOne, unwrapOne } from './entity'

export interface Settings<T, O = any> {
  autoCommit?: boolean
  classy?: boolean
  historySize?: number
  safe?: boolean
  writer?: Writer<T, O>
}

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
  defineMutation (): Mutation<T, O>
  undo (steps?: number): Instance<T, U, O>
  redo (steps?: number): Instance<T, U, O>
}

export type Entity<T, O = any> = Instance<T, T, O>

export type Entities<T, O = any> = Instance<T, T[], O>

type Unwrapper<T, I, U, O> = (
  mutation: Mutation<T, O>,
  options: Partial<UnwrapOptions<O>>
) => Promise<U>

type Streamer<T, I, U, O> = (
  mutation: Mutation<T, O>,
  options: Partial<StreamOptions<O>>
) => stream.Readable

interface State<T, I, U, O> {
  autoCommit: boolean
  input: I
  mutation: Mutation<T>
  safe: boolean
  stream: Streamer<T, I, U, O>
  unwrap: Unwrapper<T, I, U, O>
  writer: Writer<T, O>
}

function createState<T, I, U, O> (
  input: I,
  unwrap: Unwrapper<T, I, U, O>,
  stream: Streamer<T, I, U, O>,
  settings: Settings<T, O>
): State<T, I, U, O> {
  const writer = settings.writer || {}
  return {
    autoCommit: settings.autoCommit !== false,
    input,
    mutation: defineMutation(writer),
    safe: settings.safe !== false,
    stream,
    unwrap,
    writer
  }
}

function mutateState<T, I, U, O> (
  state: State<T, I, U, O>,
  procedure: (mutation: Mutation<T, O>) => Mutation<T, O>
): State<T, I, U, O> {
  return {
    ...state,
    mutation: procedure(state.mutation)
  }
}

function mutateMethod<T, I, U, O> (
  state: State<T, I, U, O>,
  newMutation: Mutation<T, O>
): State<T, I, U, O> {
  return mutateState(state, oldMutation => oldMutation.mutate(newMutation))
}

function updateMethod<T, I, U, O, A extends any[]> (
  state: State<T, I, U, O>,
  mapper: Mapper<T, A>,
  ...args: A
): State<T, I, U, O> {
  return mutateState(state, mutation => mutation.update(mapper, ...args))
}

function assignMethod<T, I, U, O> (
  state: State<T, I, U, O>,
  object: Partial<T>
): State<T, I, U, O> {
  return mutateState(state, mutation => mutation.assign(object))
}

function deleteMethod<T, I, U, O> (
  state: State<T, I, U, O>
): State<T, I, U, O> {
  return mutateState(state, mutation => mutation.delete())
}

function commitMethod<T, I, U, O> (
  state: State<T, I, U, O>
): State<T, I, U, O> {
  return mutateState(state, mutation => mutation.commit())
}

function ifMethod<T, I, U, O> (
  state: State<T, I, U, O>,
  condition: Condition<T>
): State<T, I, U, O> {
  return mutateState(state, mutation => mutation.if(condition))
}

function elseIfMethod<T, I, U, O> (
  state: State<T, I, U, O>,
  condition: Condition<T>
): State<T, I, U, O> {
  return mutateState(state, mutation => mutation.elseIf(condition))
}

function elseMethod<T, I, U, O> (
  state: State<T, I, U, O>
): State<T, I, U, O> {
  return mutateState(state, mutation => mutation.else())
}

function endIfMethod<T, I, U, O> (
  state: State<T, I, U, O>
): State<T, I, U, O> {
  return mutateState(state, mutation => mutation.endIf())
}

async function unwrapMethod<T, I, U, O> (
  state: State<T, I, U, O>,
  options?: UnwrapOptions<O>
): Promise<U> {
  return state.unwrap(
    state.mutation,
    defaults(
      objectify(options),
      {
        autoCommit: state.autoCommit,
        safe: state.safe
      }
    )
  )
}

function streamMethod<T, I, U, O> (
  state: State<T, I, U, O>,
  options?: StreamOptions<O>
): stream.Readable {
  return state.stream(
    state.mutation,
    defaults(
      objectify(options),
      {
        autoCommit: state.autoCommit,
        safe: state.safe
      }
    )
  )
}

function defineMutationMethod<T, I, U, O> (
  state: State<T, I, U, O>
): Mutation<T, O> {
  return defineMutation(state.writer)
}

function wrapState<T, I, U, O> (
  state: State<T, I, U, O>,
  settings: Settings<T, O>
): Instance<T, U, O> {
  return fluente({
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
      defineMutation: defineMutationMethod
    },
    historySize: settings.historySize || 8,
    isMutable: settings.classy === true
  })
}

export function createEntity<T, O = any> (
  one: One<T, O>,
  settings: Settings<T, O> = {}
): Entity<T, O> {
  return wrapState(
    createState(
      one,
      (mutation, options) => unwrapOne(one, createStatus, mutation, options),
      (mutation, options) => streamOne(one, createStatus, mutation, options),
      settings
    ),
    settings
  )
}

export function readEntity<T, O = any> (
  one: One<T, O>,
  settings: Settings<T, O> = {}
): Entity<T, O> {
  return wrapState(
    createState(
      one,
      (mutation, options) => unwrapOne(one, readStatus, mutation, options),
      (mutation, options) => streamOne(one, readStatus, mutation, options),
      settings
    ),
    settings
  )
}

export function createEntities<T, O = any> (
  many: Many<T, O>,
  settings: Settings<T, O> = {}
): Entities<T, O> {
  return wrapState(
    createState(
      many,
      (mutation, options) => unwrapMany(many, createStatus, mutation, options),
      (mutation, options) => streamMany(many, createStatus, mutation, options),
      settings
    ),
    settings
  )
}

export function readEntities<T, O = any> (
  many: Many<T, O>,
  settings: Settings<T, O> = {}
): Entities<T, O> {
  return wrapState(
    createState(
      many,
      (mutation, options) => unwrapMany(many, readStatus, mutation, options),
      (mutation, options) => streamMany(many, readStatus, mutation, options),
      settings
    ),
    settings
  )
}
