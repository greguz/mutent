import { Read, One, createReader } from './one'
import { Status, updateStatus, commitStatus } from './status'
import { Write, Commit, createWriter } from './write'

export type Mutator<T, U, A extends any[]> = (data: T, ...args: A) => U | Promise<U>

export interface Entity<T, O> {
  update<U, A extends any[]>(mutator: Mutator<T, U, A>, ...args: A): Entity<U, O>
  assign<E>(object: E): Entity<T & E, O>
  delete(): Entity<null, O>
  commit(): Entity<T, O>,
  unwrap(options?: O): Promise<T>
}

interface Context<S, T, O> {
  locked: boolean
  reduce: (options?: O) => Promise<Status<S, T>>
  write: Write<O>
}

function mapContext<S, T, O, X, Y> (
  ctx: Context<S, T, O>,
  mapper: (status: Status<S, T>) => Status<X, Y> | Promise<Status<X, Y>>
): Context<X, Y, O> {
  return {
    locked: false,
    reduce: options => ctx.reduce(options).then(mapper),
    write: ctx.write
  }
}

function mapStatus<S, T, U> (
  status: Status<S, T>,
  mapper: (data: T) => U | Promise<U>
): Promise<Status<S, U>> {
  return Promise.resolve(mapper(status.target)).then(
    target => updateStatus(status, target)
  )
}

function createContext<T, O> (
  read: Read<T, O>,
  write: Write<O>
): Context<null, T, O> {
  return {
    locked: false,
    reduce: read,
    write
  }
}

function readContext<T, O> (
  read: Read<T, O>,
  write: Write<O>
): Context<T, T, O> {
  return mapContext(createContext(read, write), commitStatus)
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

function commitContext<S, T, O> (
  ctx: Context<S, T, O>
): Context<T, T, O> {
  return {
    locked: false,
    reduce: options => ctx.reduce(options).then(status => ctx.write(status, options)),
    write: ctx.write
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

export function createOne<T, O> (
  one: One<T, O>,
  commit?: Commit<O>
): Entity<T, O> {
  return wrapContext(createContext(createReader(one), createWriter(commit)))
}

export function readOne<T, O> (
  one: One<T, O>,
  commit?: Commit<O>
): Entity<T, O> {
  return wrapContext(readContext(createReader(one), createWriter(commit)))
}
