import fluente from 'fluente'
import Herry from 'herry'

import { One, getOne } from './data'
import { Status, createStatus, deleteStatus, readStatus, shouldCommit, updateStatus } from './status'
import { isNull, isUndefined, mutentSymbol, objectify } from './utils'
import { Writer, handleWriter, runRoutine } from './writer'

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
  run (routine: string, ...args: any[]): Entity<T, O>
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
  mappers: Array<Mapper<T, O>>
  safe: boolean
  writer: Writer<T, O>
}

type Mapper<T, O> = (
  status: Status<T>,
  options: Partial<UnwrapOptions<O>>
) => Status<T> | Promise<Status<T>>

function createState<T, O> (
  one: One<T, O>,
  buildStatus: (data: T) => Status<T>,
  settings: Settings<T, O>
): State<T, O> {
  return {
    autoCommit: settings.autoCommit !== false,
    extract: options => getOne(one, options).then(buildStatus),
    mappers: [],
    safe: settings.safe !== false,
    writer: settings.writer || {}
  }
}

function mapState<T, O> (
  state: State<T, O>,
  mapper: Mapper<T, O>
): State<T, O> {
  return {
    ...state,
    mappers: [...state.mappers, mapper]
  }
}

function updateMethod<T, O, A extends any[]> (
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

function assignMethod<T, O> (state: State<T, O>, object: Partial<T>) {
  return updateMethod(
    state,
    data => Object.assign({}, data, object)
  )
}

function deleteMethod<T, O> (state: State<T, O>): State<T, O> {
  return mapState(state, deleteStatus)
}

async function unwrapStatus<T, O> (
  state: State<T, O>,
  status: Status<T>,
  options: Partial<UnwrapOptions<O>>
): Promise<T> {
  if (shouldCommit(status)) {
    const autoCommit = isUndefined(options.autoCommit)
      ? state.autoCommit
      : options.autoCommit !== false

    const safe = isUndefined(options.safe)
      ? state.safe
      : options.safe !== false

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

async function unwrapMethod<T, O> (
  state: State<T, O>,
  options?: UnwrapOptions<O>
): Promise<T> {
  const obj = objectify(options)

  let res = await state.extract(obj)
  if (isNull(res.target)) {
    return res.target
  }

  res = await state.mappers.reduce(
    (acc, mapper) => acc.then(status => mapper(status, obj)),
    Promise.resolve(res)
  )

  return unwrapStatus(state, res, obj)
}

function commitMethod<T, O> (state: State<T, O>): State<T, O> {
  return mapState(
    state,
    (status, options) => handleWriter(state.writer, status, options)
  )
}

function runMethod<T, O> (
  state: State<T, O>,
  key: string,
  ...args: any[]
): State<T, O> {
  return mapState(
    state,
    async (status, options) => {
      const data = await unwrapStatus(state, status, options)
      return runRoutine(state.writer, readStatus(data), options, key, ...args)
    }
  )
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
      commit: commitMethod,
      run: runMethod
    },
    methods: {
      unwrap: unwrapMethod
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
