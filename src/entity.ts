import fluente from 'fluente'

import { One, getOne } from './data'
import { Driver, Handler, createHandler } from './driver'
import { ExpectedCommitError } from './errors'
import { Status, commitStatus, createStatus, deleteStatus, shouldCommit, updateStatus } from './status'
import { isNull, isUndefined, mutentSymbol, objectify } from './utils'

export type Mutator<T, A extends any[]> = (
  data: Exclude<T, null>,
  ...args: A
) => Promise<T> | T

export type Safe = true | false | 'auto'

export type UnwrapOptions<O = {}> = O & { safe?: Safe }

export interface Entity<T, O = any> {
  isEntity: boolean
  update<A extends any[]> (mutator: Mutator<T, A>, ...args: A): Entity<T, O>
  assign (object: Partial<T>): Entity<T, O>
  delete (): Entity<T, O>
  commit (): Entity<T, O>
  unwrap (options?: UnwrapOptions<O>): Promise<T>
  undo (steps?: number): Entity<T, O>
  redo (steps?: number): Entity<T, O>
}

export interface Settings<T, O = any> {
  classy?: boolean
  driver?: Driver<T, O>
  historySize?: number
  safe?: Safe
}

interface State<T, O> {
  extract: (options: Partial<O>) => Promise<Status<T>>
  handle: Handler<T, O>
  mappers: Array<Mapper<T, O>>
  safe: Safe
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
    handle: createHandler(settings.driver),
    mappers: [],
    safe: settings.safe === 'auto' ? 'auto' : settings.safe === true
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

async function unwrapState<T, O> (
  state: State<T, O>,
  options?: UnwrapOptions<O>
): Promise<T> {
  const obj = objectify(options)
  let res = await state.mappers.reduce(
    (acc, mapper) => acc.then(status => mapper(status, obj)),
    state.extract(obj)
  )
  const safe = isUndefined(obj.safe) ? state.safe : obj.safe
  if (shouldCommit(res)) {
    if (safe === 'auto') {
      res = await state.handle(res, obj)
    } else if (safe === true) {
      throw new ExpectedCommitError(res.source, res.target, obj)
    }
  }
  return res.target
}

function commitState<T, O> (state: State<T, O>): State<T, O> {
  return mapState(state, state.handle)
}

function wrapState<T, O> (
  state: State<T, O>,
  settings: Settings<T, O>
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
      [mutentSymbol]: true,
      isEntity: true
    },
    historySize: settings.historySize,
    sharedState: settings.classy === true
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
  return wrapState(createState(one, settings), settings)
}

export function readEntity<T, O = any> (
  one: One<T, O>,
  settings: Settings<T, O> = {}
): Entity<T, O> {
  return wrapState(readState(one, settings), settings)
}
