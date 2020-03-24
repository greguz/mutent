import { One, getOne } from './one'
import { Status, updateStatus, commitStatus, createStatus } from './status'

export type Mutator<T, U, A extends any[]> = (data: T, ...args: A) => U | Promise<U>

export type Commit<O> = (source: any, target: any, options?: O) => any

export interface Entity<T, O> {
  update<U, A extends any[]> (mutator: Mutator<T, U, A>, ...args: A): Entity<U, O>
  assign<E> (object: E): Entity<T & E, O>
  delete (): Entity<null, O>
  commit (): Entity<T, O>,
  unwrap (options?: O): Promise<T>
}

interface Context<S, T, O> {
  locked: boolean
  reduce: (options?: O) => Promise<Status<S, T>>
  commit?: Commit<O>
}

function mapContext<S, T, O, X, Y> (
  ctx: Context<S, T, O>,
  mapper: (status: Status<S, T>) => Status<X, Y> | Promise<Status<X, Y>>
): Context<X, Y, O> {
  return {
    locked: false,
    reduce: options => ctx.reduce(options).then(mapper),
    commit: ctx.commit
  }
}

async function mapStatus<S, T, U> (
  status: Status<S, T>,
  mapper: (data: T) => U | Promise<U>
): Promise<Status<S, U>> {
  const target = await mapper(status.target)
  return updateStatus(status, target)
}

function createContext<T, O> (
  one: One<T, O>,
  commit?: Commit<O>
): Context<null, T, O> {
  return {
    locked: false,
    reduce: options => getOne(one, options).then(createStatus),
    commit
  }
}

function readContext<T, O> (
  one: One<T, O>,
  commit?: Commit<O>
): Context<T, T, O> {
  return mapContext(createContext(one, commit), commitStatus)
}

function updateContext<S, T, O, U, A extends any[]> (
  ctx: Context<S, T, O>,
  mutator: Mutator<T, U, A>,
  args: A
): Context<S, U, O> {
  return mapContext(
    ctx,
    status => mapStatus(status, data => mutator(data, ...args))
  )
}

function assignContext<S, T, O, E> (ctx: Context<S, T, O>, object: E) {
  return updateContext(
    ctx,
    data => ({ ...data, ...object }),
    []
  )
}

function deleteContext<S, O> (
  ctx: Context<S, any, O>
): Context<S, null, O> {
  return updateContext(
    ctx,
    () => null,
    []
  )
}

function unwrapContext<S, T, O> (
  ctx: Context<S, T, O>,
  options?: O
): Promise<T> {
  return ctx.reduce(options).then(status => status.target)
}

async function applyCommit<S, T, O> (
  status: Status<S, T>,
  commit?: Commit<O>,
  options?: O
): Promise<Status<T, T>> {
  const { source, target } = status
  if (commit && (source as any) !== target) {
    await commit(source, target, options)
  }
  return commitStatus(status)
}

function commitContext<S, T, O> (
  ctx: Context<S, T, O>
): Context<T, T, O> {
  return {
    locked: false,
    reduce: options => ctx.reduce(options).then(status => applyCommit(status, ctx.commit, options)),
    commit: ctx.commit
  }
}

function lockContext<S, T, O> (ctx: Context<S, T, O>) {
  if (ctx.locked) {
    throw new Error('This entity is immutable')
  }
  ctx.locked = true
  return ctx
}

function wrapContext<S, T, O> (ctx: Context<S, T, O>): Entity<T, O> {
  return {
    update: (mutator, ...args) => wrapContext(updateContext(lockContext(ctx), mutator, args)),
    assign: object => wrapContext(assignContext(lockContext(ctx), object)),
    delete: () => wrapContext(deleteContext(lockContext(ctx))),
    commit: () => wrapContext(commitContext(lockContext(ctx))),
    unwrap: options => unwrapContext(lockContext(ctx), options)
  }
}

export function create<T, O> (
  one: One<T, O>,
  commit?: Commit<O>
): Entity<T, O> {
  return wrapContext(createContext(one, commit))
}

export function read<T, O> (
  one: One<T, O>,
  commit?: Commit<O>
): Entity<T, O> {
  return wrapContext(readContext(one, commit))
}
