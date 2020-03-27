import { One, getOne } from './data'
import { Driver, Handler, bindDriver } from './handler'
import { Status, updateStatus, commitStatus, createStatus, unwrapStatus } from './status'

export type Mutator<T, U, A extends any[]> = (data: T, ...args: A) => U | Promise<U>

export interface Entity<T, O = unknown> {
  update<U, A extends any[]> (mutator: Mutator<T, U, A>, ...args: A): Entity<U, O>
  assign<E> (object: E): Entity<T & E, O>
  delete (): Entity<null, O>
  commit (): Entity<T, O>,
  unwrap (options?: O): Promise<T>
}

interface State<S, T, O> {
  handler: Handler<O>
  locked: boolean
  mapper: (options?: O) => Promise<Status<S, T>>
}

function createState<T, O, C> (
  context: any = {},
  one: One<T, O, C>,
  driver?: Driver<O, C>
): State<null, T, O> {
  return {
    handler: bindDriver(context, driver),
    locked: false,
    mapper: options => getOne(context, one, options).then(createStatus)
  }
}

function mapState<S, T, O, X, Y> (
  state: State<S, T, O>,
  mapper: (status: Status<S, T>) => Status<X, Y> | Promise<Status<X, Y>>
): State<X, Y, O> {
  return {
    handler: state.handler,
    locked: false,
    mapper: options => state.mapper(options).then(mapper)
  }
}

function readState<T, O, C> (
  context: any = {},
  one: One<T, O, C>,
  driver?: Driver<O, C>
): State<T, T, O> {
  return mapState(createState(context, one, driver), commitStatus)
}

function updateState<S, T, O, U, A extends any[]> (
  state: State<S, T, O>,
  mutator: Mutator<T, U, A>,
  args: A
): State<S, U, O> {
  async function mapStatus<S, T, U> (
    status: Status<S, T>,
    mapper: (data: T) => U | Promise<U>
  ): Promise<Status<S, U>> {
    const target = await mapper(status.target)
    return updateStatus(status, target)
  }
  return mapState(
    state,
    status => mapStatus(status, data => mutator(data, ...args))
  )
}

function assignState<S, T, O, E> (state: State<S, T, O>, object: E) {
  return updateState(
    state,
    data => ({ ...data, ...object }),
    []
  )
}

function deleteState<S, O> (
  state: State<S, any, O>
): State<S, null, O> {
  return updateState(
    state,
    () => null,
    []
  )
}

function unwrapState<S, T, O> (
  state: State<S, T, O>,
  options?: O
): Promise<T> {
  return state.mapper(options).then(unwrapStatus)
}

function commitState<S, T, O> (
  state: State<S, T, O>
): State<T, T, O> {
  return {
    handler: state.handler,
    locked: false,
    mapper: options => state.mapper(options).then(status => state.handler(status, options))
  }
}

function lockState<S, T, O> (state: State<S, T, O>) {
  if (state.locked) {
    throw new Error('This entity is immutable')
  }
  state.locked = true
  return state
}

function wrapState<S, T, O> (state: State<S, T, O>): Entity<T, O> {
  return {
    update: (mutator, ...args) => wrapState(updateState(lockState(state), mutator, args)),
    assign: object => wrapState(assignState(lockState(state), object)),
    delete: () => wrapState(deleteState(lockState(state))),
    commit: () => wrapState(commitState(lockState(state))),
    unwrap: options => unwrapState(lockState(state), options)
  }
}

export function create<T, O = unknown, C = unknown> (
  one: One<T, O, C>,
  driver?: Driver<O, C>,
  context?: C
): Entity<T, O> {
  return wrapState(createState(context, one, driver))
}

export function read<T, O = unknown, C = unknown> (
  one: One<T, O, C>,
  driver?: Driver<O, C>,
  context?: C
): Entity<T, O> {
  return wrapState(readState(context, one, driver))
}
