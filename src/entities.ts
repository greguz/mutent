import { Readable, transform, subscribe } from 'fluido'

import { Entity, Mutator, create, read } from './entity'
import { Many, getMany } from './many'
import { Commit } from './commit'

export interface EntitiesOptions {
  concurrency?: number
  highWaterMark?: number
}

export interface Entities<T, O> {
  update<U, A extends any[]>(mutator: Mutator<T, U, A>, ...args: A): Entities<U, O>
  assign<E>(object: E): Entities<T & E, O>
  delete(): Entities<null, O>
  commit(): Entities<T, O>,
  unwrap(options?: O & EntitiesOptions): Promise<T[]>
  // reduce: any
}

interface Context<S, T, O> {
  locked: boolean
  extract: (options?: O) => Promise<Readable>
  mapper: (data: S) => Entity<T, O>
}

function createContext<T, O> (
  many: Many<T, O>,
  commit?: Commit<O>
): Context<T, T, O> {
  return {
    locked: false,
    extract: options => getMany(many, options),
    mapper: data => create(data, commit)
  }
}

function readContext<T, O> (
  many: Many<T, O>,
  commit?: Commit<O>
): Context<T, T, O> {
  return {
    locked: false,
    extract: options => getMany(many, options),
    mapper: data => read(data, commit)
  }
}

function mapContext<S, T, U, O> (
  ctx: Context<S, T, O>,
  mapper: (entity: Entity<T, O>) => Entity<U, O>
): Context<S, U, O> {
  return {
    locked: false,
    extract: ctx.extract,
    mapper: (data: S) => mapper(ctx.mapper(data))
  }
}

function updateContext<S, T, O, U, A extends any[]> (
  ctx: Context<S, T, O>,
  mutator: Mutator<T, U, A>,
  args: A
): Context<S, U, O> {
  return mapContext(ctx, entity => entity.update(mutator, ...args))
}

function assignContext<S, T, E, O> (
  ctx: Context<S, T, O>,
  object: E
): Context<S, T & E, O> {
  return mapContext(ctx, entity => entity.assign(object))
}

function deleteContext<S, T, O> (
  ctx: Context<S, T, O>
): Context<S, null, O> {
  return mapContext(ctx, entity => entity.delete())
}

function commitContext<S, T, O> (
  ctx: Context<S, T, O>
): Context<S, T, O> {
  return mapContext(ctx, entity => entity.commit())
}

function createReducer (ctx: Context<any, any, any>, options: any) {
  const results: any[] = []
  function push (result: any) {
    results.push(result)
  }
  return transform({
    objectMode: true,
    transform (data) {
      return ctx.mapper(data).unwrap(options).then(push)
    },
    flush (callback) {
      this.push(results)
      callback()
    }
  })
}

function unwrapContext (ctx: Context<any, any, any>, options: any = {}) {
  return ctx.extract(options).then(
    stream => subscribe(stream, createReducer(ctx, options))
  )
}

function lockContext<S, T, O> (ctx: Context<S, T, O>) {
  if (ctx.locked) {
    throw new Error('Those entities are immutable')
  }
  ctx.locked = true
  return ctx
}

function wrapContext<S, T, O> (ctx: Context<S, T, O>): Entities<T, O> {
  return {
    update: (mutator, ...args) => wrapContext(updateContext(lockContext(ctx), mutator, args)),
    assign: object => wrapContext(assignContext(lockContext(ctx), object)),
    delete: () => wrapContext(deleteContext(lockContext(ctx))),
    commit: () => wrapContext(commitContext(lockContext(ctx))),
    unwrap: options => unwrapContext(lockContext(ctx), options)
  }
}

export function insert<T = any, O = any> (
  many: Many<T, O>,
  commit?: Commit<O>
): Entities<T, O> {
  return wrapContext(createContext(many, commit))
}

export function find<T = any, O = any> (
  many: Many<T, O>,
  commit?: Commit<O>
): Entities<T, O> {
  return wrapContext(readContext(many, commit))
}