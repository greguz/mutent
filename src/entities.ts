import { Readable, Writable, pipeline } from 'readable-stream'

import { Commit, Entity, Mutator, create, read } from './entity'
import { Many, getMany } from './many'

export type Reducer<T, O, R> = (
  accumulator: R,
  entity: Entity<T, O>,
  index: number,
  options?: O
) => Promise<R>

export interface Entities<T, O> {
  update<U, A extends any[]> (mutator: Mutator<T, U, A>, ...args: A): Entities<U, O>
  assign<E> (object: E): Entities<T & E, O>
  delete (): Entities<null, O>
  commit (): Entities<T, O>,
  unwrap (options?: O): Promise<T[]>
  stream (options?: O): Readable
  reduce<R> (reducer: Reducer<T, O, R>, init: R, options?: O): Promise<R>
}

interface Context<S, T, O> {
  locked: boolean
  extract: (options?: O) => Readable
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

function unwrapContext<S, T, O> (
  ctx: Context<S, T, O>,
  options?: O
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const results: T[] = []
    pipeline(
      ctx.extract(options),
      new Writable({
        objectMode: true,
        write (data: S, encoding, callback) {
          ctx
            .mapper(data)
            .unwrap(options)
            .then(result => {
              results.push(result)
              callback()
            })
            .catch(callback)
        }
      }),
      error => {
        if (error) {
          reject(error)
        } else {
          resolve(results)
        }
      }
    )
  })
}

function streamContext<S, T, O> (
  ctx: Context<S, T, O>,
  options?: O
): Readable {
  let reading = false
  return new Readable({
    objectMode: true,
    read () {
      if (reading) {
        return
      }
      reading = true
      const self = this
      pipeline(
        ctx.extract(options),
        new Writable({
          objectMode: true,
          write (data: S, encoding, callback) {
            self.push(ctx.mapper(data))
            callback()
          }
        }),
        error => {
          if (error) {
            self.emit('error', error)
          } else {
            self.push(null)
          }
        }
      )
    }
  })
}

function reduceContext<S, T, O, R> (
  ctx: Context<S, T, O>,
  reducer: Reducer<T, O, R>,
  accumulator: R,
  options?: O
): Promise<R> {
  return new Promise<R>((resolve, reject) => {
    let index = 0
    pipeline(
      ctx.extract(options),
      new Writable({
        objectMode: true,
        write (data: S, encoding, callback) {
          reducer(accumulator, ctx.mapper(data), index++, options)
            .then(result => {
              accumulator = result
              callback()
            })
            .catch(callback)
        }
      }),
      error => {
        if (error) {
          reject(error)
        } else {
          resolve(accumulator)
        }
      }
    )
  })
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
    unwrap: options => unwrapContext(lockContext(ctx), options),
    stream: options => streamContext(lockContext(ctx), options),
    reduce: (reducer, init, options) => reduceContext(ctx, reducer, init, options)
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
