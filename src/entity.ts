import { One, getOne } from './data'
import { deleteValue } from './deleted'
import { Driver, Handler, createHandler } from './handler'
import { Status, createStatus, commitStatus, updateStatus, unwrapStatus } from './status'

export type Mutator<T, A extends any[]> = (data: T, ...args: A) => T | Promise<T>

export interface Entity<T, O = any> {
  update<A extends any[]> (mutator: Mutator<T, A>, ...args: A): Entity<T, O>
  assign (object: Partial<T>): Entity<T, O>
  delete (): Entity<T, O>
  commit (): Entity<T, O>
  unwrap (options?: O): Promise<T>
}

interface Context<T, O> {
  locked: boolean
  reduce: (options?: O) => Promise<Status<T>>
  handle: Handler<T, O>
}

function mapContext<T, O> (
  ctx: Context<T, O>,
  mapper: (status: Status<T>) => Status<T> | Promise<Status<T>>
): Context<T, O> {
  return {
    locked: false,
    reduce: options => ctx.reduce(options).then(mapper),
    handle: ctx.handle
  }
}

async function mapStatus<T> (
  status: Status<T>,
  mapper: (data: T) => T | Promise<T>
): Promise<Status<T>> {
  const target = await mapper(status.target)
  return updateStatus(status, target)
}

function createContext<T, O> (
  one: One<T, O>,
  handle: Handler<T, O>
): Context<T, O> {
  return {
    locked: false,
    reduce: options => getOne(one, options).then(createStatus),
    handle
  }
}

function readContext<T, O> (
  one: One<T, O>,
  handle: Handler<T, O>
): Context<T, O> {
  return mapContext(createContext(one, handle), commitStatus)
}

function updateContext<T, O, A extends any[]> (
  ctx: Context<T, O>,
  mutator: Mutator<T, A>,
  args: A
): Context<T, O> {
  return mapContext(
    ctx,
    status => mapStatus(status, data => mutator(data, ...args))
  )
}

function assignContext<T, O> (ctx: Context<T, O>, object: Partial<T>) {
  return updateContext(
    ctx,
    data => ({ ...data, ...object }),
    []
  )
}

function deleteContext<T, O> (
  ctx: Context<T, O>
): Context<T, O> {
  return updateContext(ctx, deleteValue, [])
}

function unwrapContext<T, O> (
  ctx: Context<T, O>,
  options?: O
): Promise<T> {
  return ctx.reduce(options).then(unwrapStatus)
}

function commitContext<T, O> (
  { handle, reduce }: Context<T, O>
): Context<T, O> {
  return {
    locked: false,
    reduce: options => reduce(options).then(status => handle(status, options)),
    handle
  }
}

function lockContext<T, O> (ctx: Context<T, O>) {
  if (ctx.locked) {
    throw new Error('This entity is immutable')
  }
  ctx.locked = true
  return ctx
}

function wrapContext<T, O> (ctx: Context<T, O>): Entity<T, O> {
  return {
    update: (mutator, ...args) => wrapContext(updateContext(lockContext(ctx), mutator, args)),
    assign: object => wrapContext(assignContext(lockContext(ctx), object)),
    delete: () => wrapContext(deleteContext(lockContext(ctx))),
    commit: () => wrapContext(commitContext(lockContext(ctx))),
    unwrap: options => unwrapContext(lockContext(ctx), options)
  }
}

export function create<T, O = any> (
  one: One<T, O>,
  driver?: Driver<T, O>
): Entity<T, O> {
  return wrapContext(createContext(one, createHandler(driver)))
}

export function read<T, O = any> (
  one: One<T, O>,
  driver?: Driver<T, O>
): Entity<T, O> {
  return wrapContext(readContext(one, createHandler(driver)))
}
