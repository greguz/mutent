import { Read } from './read'
import { Status, updateStatus, commitStatus } from './status'
import { Write } from './write'

export interface Context<S, T, O> {
  locked: boolean
  reduce: (options?: O) => Promise<Status<S, T, O>>
  write: Write<O>
}

function mapContext<S, T, O, X, Y> (
  ctx: Context<S, T, O>,
  mapper: (status: Status<S, T, O>) => Status<X, Y, O> | Promise<Status<X, Y, O>>
): Context<X, Y, O> {
  return {
    locked: false,
    reduce: options => ctx.reduce(options).then(mapper),
    write: ctx.write
  }
}

async function mapStatus<S, T, O, U> (
  status: Status<S, T, O>,
  mapper: (data: T) => U | Promise<U>
): Promise<Status<S, U, O>> {
  return updateStatus(status, await mapper(status.target))
}

export function createContext<S, O> (
  read: Read<S, O>,
  write: Write<O>
): Context<null, S, O> {
  return {
    locked: false,
    reduce: read,
    write
  }
}

export function readContext<S, O> (
  read: Read<S, O>,
  write: Write<O>
): Context<S, S, O> {
  return mapContext(createContext(read, write), commitStatus)
}

export function updateContext<S, T, O, U, A extends any[]> (
  ctx: Context<S, T, O>,
  mutator: (data: T, ...args: A) => U | Promise<U>,
  args: A
): Context<S, U, O> {
  return mapContext(
    ctx,
    status => mapStatus(status, data => mutator(data, ...args))
  )
}

export function assignContext<S, T, O, E> (ctx: Context<S, T, O>, object: E) {
  return updateContext(
    ctx,
    data => ({ ...data, ...object }),
    []
  )
}

export function deleteContext<S, O> (
  ctx: Context<S, any, O>
): Context<S, null, O> {
  return updateContext(
    ctx,
    () => null,
    []
  )
}

export function unwrapContext<S, T, O> (
  ctx: Context<S, T, O>,
  options?: O
): Promise<T> {
  return ctx.reduce(options).then(status => status.target)
}

export function commitContext<S, T, O> (
  ctx: Context<S, T, O>
): Context<T, T, O> {
  return {
    locked: false,
    reduce: options => ctx.reduce(options).then(ctx.write),
    write: ctx.write
  }
}

export function connectContext<S, T, O> (
  ctx: Context<S, T, any>,
  write: Write<O>
): Context<S, T, O> {
  return {
    locked: false,
    reduce: ctx.reduce,
    write
  }
}

export function lockContext<S, T, O> (ctx: Context<S, T, O>) {
  if (ctx.locked) {
    throw new Error('This entity is immutable')
  }
  ctx.locked = true
  return ctx
}
