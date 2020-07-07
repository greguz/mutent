import fluente from 'fluente'
import Herry from 'herry'

import { One, getOne } from './data'
import { Mapper, Mutation, defineMutation } from './mutation'
import { Status, createStatus, readStatus, shouldCommit } from './status'
import { isNull, isUndefined, mutentSymbol, objectify } from './utils'
import { Writer, handleWriter } from './writer'

export type UnwrapOptions<O = {}> = O & {
  autoCommit?: boolean
  safe?: boolean
}

export interface Entity<T, O = any> {
  isEntity: boolean
  update<A extends any[]> (mapper: Mapper<T, A>, ...args: A): Entity<T, O>
  assign (object: Partial<T>): Entity<T, O>
  delete (): Entity<T, O>
  commit (): Entity<T, O>
  unwrap (options?: UnwrapOptions<O>): Promise<T>
  undo (steps?: number): Entity<T, O>
  redo (steps?: number): Entity<T, O>
}

export interface Settings<T, O = any> {
  autoCommit?: boolean
  classy?: boolean
  historySize?: number
  safe?: boolean
  writer?: Writer<T, O>
}

type Extractor<T, O> = (options: Partial<O>) => Promise<Status<T>>

interface State<T, O> {
  autoCommit: boolean
  extract: Extractor<T, O>
  mutation: Mutation<T>
  safe: boolean
  writer: Writer<T, O>
}

function createState<T, O> (
  extract: Extractor<T, O>,
  settings: Settings<T, O>
): State<T, O> {
  const writer = settings.writer || {}
  return {
    autoCommit: settings.autoCommit !== false,
    extract,
    mutation: defineMutation(writer),
    safe: settings.safe !== false,
    writer
  }
}

function updateMethod<T, O, A extends any[]> (
  state: State<T, O>,
  mapper: Mapper<T, A>,
  ...args: A
): State<T, O> {
  return {
    ...state,
    mutation: state.mutation.update(mapper, ...args)
  }
}

function assignMethod<T, O> (
  state: State<T, O>,
  object: Partial<T>
): State<T, O> {
  return {
    ...state,
    mutation: state.mutation.assign(object)
  }
}

function deleteMethod<T, O> (state: State<T, O>): State<T, O> {
  return {
    ...state,
    mutation: state.mutation.delete()
  }
}

function commitMethod<T, O> (state: State<T, O>): State<T, O> {
  return {
    ...state,
    mutation: state.mutation.commit()
  }
}

async function unwrapMethod<T, O> (
  state: State<T, O>,
  options?: UnwrapOptions<O>
): Promise<T> {
  const obj = objectify(options)

  let status = await state.extract(obj)
  if (isNull(status.target)) {
    return status.target
  }

  status = await state.mutation.render()(status, obj)

  if (shouldCommit(status)) {
    const autoCommit = isUndefined(obj.autoCommit)
      ? state.autoCommit
      : obj.autoCommit !== false

    const safe = isUndefined(obj.safe)
      ? state.safe
      : obj.safe !== false

    if (autoCommit) {
      status = await handleWriter(state.writer, status, options)
    } else if (safe) {
      throw new Herry('EMUT_NOCOM', 'Expected commit', {
        source: status.source,
        target: status.target,
        options
      })
    }
  }

  return status.target
}

function wrapState<T, O> (
  state: State<T, O>,
  settings: Settings<T, O>
): Entity<T, O> {
  return fluente({
    state,
    fluent: {
      update: updateMethod,
      assign: assignMethod,
      delete: deleteMethod,
      commit: commitMethod
    },
    methods: {
      unwrap: unwrapMethod
    },
    constants: {
      [mutentSymbol]: true,
      isEntity: true
    },
    historySize: settings.historySize || 8,
    isMutable: settings.classy === true
  })
}

export function isEntity (value: any): value is Entity<any, any> {
  return typeof value === 'object' && value !== null
    ? value[mutentSymbol] === true && value.isEntity === true
    : false
}

export function createEntity<T, O = any> (
  one: One<T, O>,
  settings: Settings<T, O> = {}
): Entity<T, O> {
  return wrapState(
    createState(
      options => getOne(one, options).then(createStatus),
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
      options => getOne(one, options).then(readStatus),
      settings
    ),
    settings
  )
}
