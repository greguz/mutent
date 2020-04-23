import fluente from 'fluente'

import { One, getOne } from './data'
import { Driver, Handler, createHandler } from './driver'
import { Status, createStatus, commitStatus, updateStatus, deleteStatus } from './status'
import { isNull, objectify } from './utils'

export type Mutator<T, A extends any[]> = (
  data: Exclude<T, null>,
  ...args: A
) => Promise<T> | T

export interface Entity<T, O = any> {
  isEntity: boolean
  update<A extends any[]> (mutator: Mutator<T, A>, ...args: A): Entity<T, O>
  assign (object: Partial<T>): Entity<T, O>
  delete (): Entity<T, O>
  commit (): Entity<T, O>
  unwrap (options?: O): Promise<T>
  undo (steps?: number): Entity<T, O>
  redo (steps?: number): Entity<T, O>
}

export interface Settings<T, O = any> extends Driver<T, O> {
  historySize?: number
}

interface State<T, O> {
  extract: (options: Partial<O>) => Promise<Status<T>>
  handler: Handler<T, O>
  mappers: Array<Mapper<T, O>>
}

type Mapper<T, O> = (
  status: Status<T>,
  options: Partial<O>
) => Status<T> | Promise<Status<T>>

function createState<T, O> (
  one: One<T, O>,
  settings: Settings<T, O>
): State<T, O> {
  return {
    extract: options => getOne(one, options).then(createStatus),
    handler: createHandler(settings),
    mappers: []
  }
}

function skipNullMutations<T, O> (mapper: Mapper<T, O>): Mapper<T, O> {
  return function wrappedMapper (status, options) {
    return isNull(status.target)
      ? status
      : mapper(status, options)
  }
}

function mapState<T, O> (
  state: State<T, O>,
  mapper: Mapper<T, O>
): State<T, O> {
  return {
    ...state,
    mappers: [...state.mappers, skipNullMutations(mapper)]
  }
}

function readState<T, O> (
  one: One<T, O>,
  settings: Settings<T, O>
): State<T, O> {
  return mapState(createState(one, settings), commitStatus)
}

function updateState<T, O, A extends any[]> (
  state: State<T, O>,
  mutator: Mutator<T, A>,
  ...args: A
): State<T, O> {
  return mapState(
    state,
    async (status: Status<any>) => {
      const result = await mutator(status.target, ...args)
      return updateStatus(status, result)
    }
  )
}

function assignState<T, O> (state: State<T, O>, object: Partial<T>) {
  return updateState(
    state,
    data => Object.assign({}, data, object)
  )
}

function deleteState<T, O> (state: State<T, O>): State<T, O> {
  return mapState(state, deleteStatus)
}

function unwrapState<T, O> (
  state: State<T, O>,
  options?: O
): Promise<T> {
  const obj = objectify(options)
  return state.mappers.reduce(
    (acc, mapper) => acc.then(status => mapper(status, obj)),
    state.extract(obj)
  ).then(status => status.target)
}

function commitState<T, O> (state: State<T, O>): State<T, O> {
  return mapState(state, state.handler)
}

function wrapState<T, O> (
  state: State<T, O>,
  historySize?: number
): Entity<T, O> {
  return fluente({
    state,
    fluent: {
      update: updateState,
      assign: assignState,
      delete: deleteState,
      commit: commitState
    },
    methods: {
      unwrap: unwrapState
    },
    constants: {
      [Symbol.for('mutent')]: true,
      isEntity: true
    },
    historySize
  })
}

export function isEntity (value: any): value is Entity<any, any> {
  return typeof value === 'object' && value !== null
    ? value[Symbol.for('mutent')] === true && value.isEntity === true
    : false
}

export function createEntity<T, O = any> (
  one: One<T, O>,
  settings: Settings<T, O> = {}
): Entity<T, O> {
  return wrapState(
    createState(one, settings),
    settings.historySize
  )
}

export function readEntity<T, O = any> (
  one: One<T, O>,
  settings: Settings<T, O> = {}
): Entity<T, O> {
  return wrapState(
    readState(one, settings),
    settings.historySize
  )
}
