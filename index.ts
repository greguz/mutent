export type Mutator<D, U, A extends any[]> = (data: D, ...args: A) => U

export type Mapper<D, U> = Mutator<D, U, []>

export type Factory<D, O> = (options?: O) => D | Promise<D>

export type Source<D, O> = D | Factory<D, O>

export type Commit<O> = (source: any, target: any, options?: O) => any

export interface Entity<D, O> {
  update<U, A extends any[]>(mutator: Mutator<D, U, A>, ...args: A): Entity<U, O>
  assign<E>(object: E): Entity<D & E, O>
  delete(): Entity<null, O>
  commit(): Entity<D, O>,
  unwrap(options?: O): Promise<D>
  connect<X>(commit: Commit<X>): Entity<D, X>
  release(): Entity<D, any>
}

interface Status<S, T> {
  source: S,
  target: T
}

interface Context<S, T, O> {
  locked: boolean
  reduce: (options?: O) => Promise<Status<S, T>>
  commit: Commit<O>
}

function noUndef<T> (value: T): T {
  if (value === undefined) {
    throw new Error('An entity cannot be undefined')
  }
  return value
}

function volatile () {
  return Promise.resolve()
}

async function buildSource<D, O> (factory: Factory<D, O>, options?: O): Promise<D> {
  return factory(options)
}

function extractSource<D, O> (source: Source<D, O>, options?: O): Promise<D> {
  return typeof source === 'function'
    ? buildSource(source as any, options)
    : Promise.resolve(source)
}

function createStatus<S, O> (source: Source<S, O>, options?: O): Promise<Status<null, S>> {
  return extractSource(source, options).then(target => ({ source: null, target: noUndef(target) }))
}

function mapStatus<S, T, U> (status: Status<S, T>, mapper: Mapper<T, U>): Status<S, U> {
  return {
    source: status.source,
    target: noUndef(mapper(status.target))
  }
}

async function commitStatus<S, T, O> (
  { source, target }: Status<S, T>,
  commit: Commit<O>,
  options?: O
): Promise<Status<T, T>> {
  if (source !== null || target !== null) {
    await commit(source, target, options)
  }
  return {
    source: target,
    target
  }
}

function createContext<S, O> (
  source: Source<S, O>,
  commit: Commit<O>
): Context<null, S, O> {
  return {
    locked: false,
    reduce: options => createStatus(source, options),
    commit
  }
}

function readContext<S, O> (
  source: Source<S, O>,
  commit: Commit<O>
): Context<S, S, O> {
  return {
    locked: false,
    reduce: options => createStatus(source, options).then(status => commitStatus(status, volatile, options)),
    commit
  }
}

function updateContext<D, T, U, O, A extends any[]> (
  ctx: Context<D, T, O>,
  mutator: Mutator<T, U, A>,
  args: A
): Context<D, U, O> {
  return {
    locked: false,
    reduce: options => ctx.reduce(options).then(status => mapStatus(status, data => mutator(data, ...args))),
    commit: ctx.commit
  }
}

function assignContext<D, T, O, E> (ctx: Context<D, T, O>, object: E) {
  return updateContext(
    ctx,
    data => ({ ...data, ...object }),
    []
  )
}

function deleteContext<D, O> (ctx: Context<D, any, O>): Context<D, null, O> {
  return updateContext(
    ctx,
    () => null,
    []
  )
}

function commitContext<D, T, O> (ctx: Context<D, T, O>): Context<T, T, O> {
  return {
    locked: false,
    commit: ctx.commit,
    reduce: options => ctx.reduce(options).then(status => commitStatus(status, ctx.commit, options))
  }
}

function unwrapContext<S, T, O> (
  ctx: Context<S, T, O>,
  options?: O
): Promise<T> {
  return ctx.reduce(options).then(status => status.target)
}

function connectContext<D, T, O> (ctx: Context<D, T, any>, commit: Commit<O>): Context<D, T, O> {
  return {
    commit,
    locked: false,
    reduce: ctx.reduce
  }
}

function releaseContext<D, T> (ctx: Context<D, T, any>) {
  return connectContext(ctx, volatile)
}

function lockContext<D, T, O> (ctx: Context<D, T, O>) {
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
    unwrap: options => unwrapContext(lockContext(ctx), options),
    connect: commit => wrapContext(connectContext(lockContext(ctx), commit)),
    release: () => wrapContext(releaseContext(lockContext(ctx)))
  }
}

export function create<S, O> (
  source: Source<S, O>,
  commit: Commit<O> = volatile
): Entity<S, O> {
  return wrapContext(createContext(source, commit))
}

export function read<S, O> (
  source: Source<S, O>,
  commit: Commit<O> = volatile
): Entity<S, O> {
  return wrapContext(readContext(source, commit))
}
