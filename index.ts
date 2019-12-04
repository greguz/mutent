export type Mutator<D, U, A extends any[]> = (data: D, ...args: A) => U

export type Mapper<D, U> = Mutator<D, U, []>

export type Factory<D, O> = (options?: O) => D | Promise<D>

export type Source<D, O> = D | Factory<D, O>

export type Commit<O> = (source: any, target: any, options?: O) => any

export interface Entity<D, O> {
  update<U, A extends any[]>(mutator: Mutator<D, U, A>, ...args: A): Entity<U, O>
  delete(): Entity<null, O>
  assign<E>(object: E): Entity<D & E, O>
  unwrap(options?: O): Promise<D>
  connect<X>(commit: Commit<X>): Entity<D, X>
  release(): Entity<D, any>
}

interface Context<D, T, O> {
  locked: boolean
  source: Source<D, O>
  target: Mapper<D, T>
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

async function build<D, O> (factory: Factory<D, O>, options?: O): Promise<D> {
  return factory(options)
}

function extract<D, O> (source: Source<D, O>, options?: O): Promise<D> {
  return typeof source === 'function'
    ? build(source as any, options)
    : Promise.resolve(source)
}

function _source<D, T, O> (ctx: Context<D, T, O>, options?: O): Promise<D> {
  return extract(ctx.source, options)
}

async function _unwrap<D, T, O> (
  ctx: Context<D, T, O>,
  options?: O
): Promise<T> {
  const source = await _source(ctx, options)
  const target = ctx.target(source)
  if (source !== null || target !== null) {
    await ctx.commit(source, target, options)
  }
  return target
}

function _create<D, T, O> (
  source: Source<D, O>,
  target: Mapper<D, T>,
  commit: Commit<O>
): Context<D, T, O> {
  return {
    locked: false,
    source,
    target,
    commit
  }
}

function _update<D, T, U, O, A extends any[]> (
  ctx: Context<D, T, O>,
  mutator: Mutator<T, U, A>,
  args: A
) {
  return _create(
    ctx.source,
    (data: D) => noUndef(mutator(ctx.target(data), ...args)),
    ctx.commit
  )
}

function _delete<D, O> (ctx: Context<D, any, O>) {
  return _create(
    ctx.source,
    asConst(null),
    ctx.commit
  )
}

function _assign<D, T, O, E> (ctx: Context<D, T, O>, extension: E) {
  return _update(
    ctx,
    data => ({ ...data, ...extension }),
    []
  )
}

function _connect<D, T, O> (ctx: Context<D, T, any>, commit: Commit<O>) {
  return _create(
    ctx.source,
    ctx.target,
    commit
  )
}

function _release<D, T> (ctx: Context<D, T, any>) {
  return _connect(ctx, volatile)
}

function _lock<D, T, O> (ctx: Context<D, T, O>) {
  if (ctx.locked) {
    throw new Error('This entity is immutable')
  }
  ctx.locked = true
  return ctx
}

function _wrap<D, T, O> (ctx: Context<D, T, O>): Entity<T, O> {
  return {
    update: (mutator, ...args) => _wrap(_update(_lock(ctx), mutator, args)),
    delete: () => _wrap(_delete(_lock(ctx))),
    assign: object => _wrap(_assign(_lock(ctx), object)),
    unwrap: options => _unwrap(_lock(ctx), options),
    connect: commit => _wrap(_connect(_lock(ctx), commit)),
    release: () => _wrap(_release(_lock(ctx)))
  }
}

export function create<D, O> (
  data: D,
  commit: Commit<O> = volatile
): Entity<D, O> {
  return _wrap(_create(null, asConst(noUndef(data)), commit))
}

export function read<D, O> (
  source: Source<D, O>,
  commit: Commit<O> = volatile
): Entity<D, O> {
  return _wrap(_create(noUndef(source), passthrough, commit))
}
