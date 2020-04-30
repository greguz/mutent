import fluente from 'fluente'

import { One, getOne } from './data'
import { ExpectedCommitError } from './errors'
import { Status, createStatus, deleteStatus, readStatus, shouldCommit, updateStatus } from './status'
import { isNull, isUndefined, mutentSymbol, objectify } from './utils'
import { Handler, Writer, createHandler } from './writer'

export type Mutator<T, A extends any[]> = (
  data: Exclude<T, null>,
  ...args: A
) => Promise<T> | T

export type UnwrapOptions<O = {}> = O & {
  autoCommit?: boolean
  safe?: boolean
}

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
  autoCommit?: boolean
  classy?: boolean
  historySize?: number
  safe?: boolean
  writer?: Writer<T, O>
}

interface State<T, O> {
  autoCommit: boolean
  extract: (options: Partial<O>) => Promise<Status<T>>
  handle: Handler<T, O>
  mappers: Array<Mapper<T, O>>
  safe: boolean
}

type Mapper<T, O> = (
  status: Status<T>,
  options: Partial<O>
) => Status<T> | Promise<Status<T>>

function createState<T, O> (
  one: One<T, O>,
  buildStatus: (data: T) => Status<T>,
  settings: Settings<T, O>
): State<T, O> {
  return {
    autoCommit: settings.autoCommit !== false,
    extract: options => getOne(one, options).then(buildStatus),
    handle: createHandler(settings.writer),
    mappers: [],
    safe: settings.safe !== false
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

  const autoCommit = isUndefined(obj.autoCommit)
    ? state.autoCommit
    : obj.autoCommit !== false

  const safe = isUndefined(obj.safe)
    ? state.safe
    : obj.safe !== false

  if (shouldCommit(res)) {
    if (autoCommit) {
      res = await state.handle(res, obj)
    } else if (safe) {
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
  return wrapState(
    createState(one, createStatus, settings),
    settings
  )
}

export function readEntity<T, O = any> (
  one: One<T, O>,
  settings: Settings<T, O> = {}
): Entity<T, O> {
  return wrapState(
    createState(one, readStatus, settings),
    settings
  )
}
