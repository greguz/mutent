import { One, getOne } from './data'
import { deleteValue } from './deleted'
import { Driver, Handler, createHandler } from './handler'
import { Status, createStatus, commitStatus, updateStatus } from './status'

export type Mutator<T, A extends any[]> = (data: T, ...args: A) => T | Promise<T>

export interface Entity<T, O = any> {
  update<A extends any[]> (mutator: Mutator<T, A>, ...args: A): Entity<T, O>
  assign (object: Partial<T>): Entity<T, O>
  delete (): Entity<T, O>
  commit (): Entity<T, O>
  unwrap (options?: O): Promise<T>
}

type Mapper<T, O> = (status: Status<T>, options?: O) => Status<T> | Promise<Status<T>>

interface Context<T, O> {
  handler: Handler<T, O>
  locked: boolean
  extract: (options?: O) => Promise<Status<T>>
  past: Array<Mapper<T, O>>
  future: Array<Mapper<T, O>>
}

function createContext<T, O> (
  one: One<T, O>,
  handler: Handler<T, O>
): Context<T, O> {
  return {
    handler,
    locked: false,
    extract: options => getOne(one, options).then(createStatus),
    past: [],
    future: []
  }
}

function mapContext<T, O> (
  ctx: Context<T, O>,
  mapper: Mapper<T, O>
): Context<T, O> {
  return {
    ...ctx,
    locked: false,
    past: [...ctx.past, mapper]
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
    async status => {
      const result = await mutator(status.target, ...args)
      return updateStatus(status, result)
    }
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

async function unwrapContext<T, O> (
  ctx: Context<T, O>,
  options?: O
): Promise<T> {
  const { target } = await ctx.past.reduce(
    (acc, mapper) => acc.then(status => mapper(status, options)),
    ctx.extract(options)
  )
  return target
}

function commitContext<T, O> (ctx: Context<T, O>): Context<T, O> {
  return mapContext(ctx, ctx.handler)
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
