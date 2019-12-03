export type Mutator<T, U> = (data: T) => U;

export type Factory<T, O> = (options?: O) => T | Promise<T>

export type Source<T, O> = T | Factory<T, O>

export type Commit<O> = (source: any, target: any, options?: O) => Promise<any>;

export interface Entity<D, O> {
  update<U>(mutator: Mutator<D, U>): Entity<U, O>;
  delete(): Entity<null, O>;
  commit(options?: O): Promise<Entity<D, O>>;
  toJSON(): D;
  unwrap(options?: O): Promise<D>
}

interface Context<D, T, O> {
  locked: boolean;
  source: Source<D, O>;
  target: Mutator<D, T>;
  commit: Commit<O>
}

function noUndef<T> (value: T): T {
  if (value === undefined) {
    throw new Error('An entity cannot be undefined')
  }
  return value
}

function asConst<T> (data: T) {
  return () => data
}

function passthrough<T> (value: T) {
  return noUndef(value)
}

function volatile () {
  return Promise.resolve()
}

function lock<D, T, O> (ctx: Context<D, T, O>) {
  if (ctx.locked) {
    throw new Error('This entity is immutable')
  }
  ctx.locked = true
  return ctx
}

async function fetch<D, O> (source: Source<D, O>, options?: O): Promise<D> {
  if (typeof source === 'function') {
    return (source as any)(options)
  } else {
    return source
  }
}

function ctxCreate<D, T, O> (
  source: Source<D, O>,
  target: Mutator<D, T>,
  commit: Commit<O>
): Context<D, T, O> {
  return {
    locked: false,
    source,
    target,
    commit
  }
}

function ctxUpdate<D, T, U, O> (ctx: Context<D, T, O>, mutator: Mutator<T, U>) {
  return ctxCreate(
    ctx.source,
    (data: D) => noUndef(mutator(ctx.target(data))),
    ctx.commit
  )
}

function ctxDelete<D, T, O> (ctx: Context<D, T, O>) {
  return ctxCreate(
    ctx.source,
    () => null,
    ctx.commit
  )
}

async function ctxCommit<D, T, O> (
  ctx: Context<D, T, O>,
  options?: O
): Promise<Context<T, T, O>> {
  const source = await fetch(ctx.source, options)
  const target = ctx.target(source)
  if (source !== null || target !== null) {
    await ctx.commit(source, target, options)
  }
  return ctxCreate(target, passthrough, ctx.commit)
}

function ctxExtract<D, T, O> (ctx: Context<D, T, O>) {
  const { source, target } = ctx
  if (typeof source === 'function') {
    throw new Error('Entity not ready')
  }
  return target(source)
}

function wrap<D, T, O> (ctx: Context<D, T, O>): Entity<T, O> {
  const commit = (options?: O) => ctxCommit(lock(ctx), options).then(wrap)
  return {
    update: mutator => wrap(ctxUpdate(lock(ctx), mutator)),
    delete: () => wrap(ctxDelete(lock(ctx))),
    commit,
    toJSON: () => ctxExtract(lock(ctx)),
    unwrap: (options?: O) => commit(options).then(entity => entity.toJSON())
  }
}

export function create<D, O> (
  data: D,
  commit: Commit<O> = volatile
): Entity<D, O> {
  return wrap(ctxCreate(null, asConst(noUndef(data)), commit))
}

export function read<D, O> (
  source: Source<D, O>,
  commit: Commit<O> = volatile
): Entity<D, O> {
  return wrap(ctxCreate(noUndef(source), passthrough, commit))
}
