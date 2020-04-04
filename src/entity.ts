import { One, getOne } from './data'
import { Driver, Handler, createHandler } from './handler'
import { Status, createStatus, commitStatus, updateStatus, deleteStatus } from './status'

export type Mutator<T, A extends any[]> = (
  data: Exclude<T, null>,
  ...args: A
) => T | Promise<T>

export interface Entity<T, O = any> {
  update<A extends any[]> (mutator: Mutator<T, A>, ...args: A): Entity<T, O>
  assign (object: Partial<T>): Entity<T, O>
  delete (): Entity<T, O>
  commit (): Entity<T, O>
  unwrap (options?: O): Promise<T>
  undo (steps?: number): Entity<T, O>
  redo (steps?: number): Entity<T, O>
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
  driver?: Driver<T, O>
): Context<T, O> {
  return {
    handler: createHandler(driver),
    locked: false,
    extract: options => getOne(one, options).then(createStatus),
    past: [],
    future: []
  }
}

function skipNullMutations<T, O> (mapper: Mapper<T, O>): Mapper<T, O> {
  return function wrappedMapper (status, options) {
    return status.target === null
      ? status
      : mapper(status, options)
  }
}

function mapContext<T, O> (
  ctx: Context<T, O>,
  mapper: Mapper<T, O>
): Context<T, O> {
  return {
    ...ctx,
    locked: false,
    past: [...ctx.past, skipNullMutations(mapper)]
  }
}

function readContext<T, O> (
  one: One<T, O>,
  driver?: Driver<T, O>
): Context<T, O> {
  return mapContext(createContext(one, driver), commitStatus)
}

function updateContext<T, O, A extends any[]> (
  ctx: Context<T, O>,
  mutator: Mutator<T, A>,
  args: A
): Context<T, O> {
  return mapContext(
    ctx,
    async (status: Status<any>) => {
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

function deleteContext<T, O> (ctx: Context<T, O>): Context<T, O> {
  return mapContext(ctx, deleteStatus)
}

function unwrapContext<T, O> (
  ctx: Context<T, O>,
  options?: O
): Promise<T> {
  return ctx.past.reduce(
    (acc, mapper) => acc.then(status => mapper(status, options)),
    ctx.extract(options)
  ).then(status => status.target)
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

function parseSteps (limit: number, steps: any = 1) {
  if (steps < 0 || typeof steps !== 'number' || isNaN(steps)) {
    return 0
  } else if (steps > limit) {
    return limit
  } else {
    return Math.floor(steps)
  }
}

function undoContext<T, O> (
  ctx: Context<T, O>,
  steps?: number
): Context<T, O> {
  const index = ctx.past.length - parseSteps(ctx.past.length, steps)
  const past = ctx.past.slice(0, index)
  const future = ctx.past.slice(index)
  return {
    ...ctx,
    locked: false,
    past,
    future: [...future, ...ctx.future]
  }
}

function redoContext<T, O> (
  ctx: Context<T, O>,
  steps?: number
): Context<T, O> {
  const index = parseSteps(ctx.future.length, steps)
  const past = ctx.future.slice(0, index)
  const future = ctx.future.slice(index)
  return {
    ...ctx,
    locked: false,
    past: [...ctx.past, ...past],
    future
  }
}

function wrapContext<T, O> (ctx: Context<T, O>): Entity<T, O> {
  return {
    update: (mutator, ...args) => wrapContext(updateContext(lockContext(ctx), mutator, args)),
    assign: object => wrapContext(assignContext(lockContext(ctx), object)),
    delete: () => wrapContext(deleteContext(lockContext(ctx))),
    commit: () => wrapContext(commitContext(lockContext(ctx))),
    unwrap: options => unwrapContext(lockContext(ctx), options),
    undo: steps => wrapContext(undoContext(lockContext(ctx), steps)),
    redo: steps => wrapContext(redoContext(lockContext(ctx), steps))
  }
}

export function create<T, O = any> (
  one: One<T, O>,
  driver?: Driver<T, O>
): Entity<T, O> {
  return wrapContext(createContext(one, driver))
}

export function read<T, O = any> (
  one: One<T, O>,
  driver?: Driver<T, O>
): Entity<T, O> {
  return wrapContext(readContext(one, driver))
}
