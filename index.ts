export type Mutator<T, U> = (entity: T) => U;

export type Commit<O> = (source: any, target: any, options?: O) => Promise<any>;

export interface Entity<T, O> {
  update<U>(mutator: Mutator<T, U>): Entity<U, O>;
  delete(): Entity<null, O>;
  commit(options?: O): Promise<Entity<T, O>>;
  toJSON(): T;
}

interface Context<S, T> {
  locked: boolean;
  source: S;
  target: T;
}

function _lock<S, T>(ctx: Context<S, T>) {
  if (ctx.locked) {
    throw new Error("This entity is immutable");
  }
  ctx.locked = true;
  return ctx;
}

function _create<S, T>(source: S, target: T): Context<S, T> {
  if (source === undefined || target === undefined) {
    throw new Error("An entity cannot be undefined");
  }
  return {
    locked: false,
    source,
    target
  };
}

function _update<S, T, U>(ctx: Context<S, T>, mutator: Mutator<T, U>) {
  return _create(ctx.source, mutator(ctx.target));
}

function _delete<S, T>(ctx: Context<S, T>) {
  return _create(ctx.source, null);
}

async function _commit<S, T, O>(
  ctx: Context<S, T>,
  commit: Commit<O>,
  options?: O
) {
  const { source, target } = ctx;
  if (source === null && target === null) {
    return _create(source, target);
  }
  const output = await commit(source, target, options);
  const data = target === null ? null : output || target;
  return _create(data, data);
}

function _wrap<S, T, O>(ctx: Context<S, T>, commit: Commit<O>): Entity<T, O> {
  return {
    update: mutator => _wrap(_update(_lock(ctx), mutator), commit),
    delete: () => _wrap(_delete(_lock(ctx)), commit),
    commit: options =>
      _commit(_lock(ctx), commit, options).then(ctx => _wrap(ctx, commit)),
    toJSON: () => _lock(ctx).target
  };
}

function _passthrough() {
  return Promise.resolve();
}

export function create<T, O>(
  data: T,
  commit: Commit<O> = _passthrough
): Entity<T, O> {
  return _wrap(_create(null, data), commit);
}

export function read<T, O>(
  data: T,
  commit: Commit<O> = _passthrough
): Entity<T, O> {
  return _wrap(_create(data, data), commit);
}
