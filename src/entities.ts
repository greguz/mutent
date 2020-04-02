import core from 'stream'
import { Readable, Writable, pipeline } from 'readable-stream'

import { Many, getMany } from './data'
import { Entity, Mutator, create, read } from './entity'
import { Driver } from './handler'

export type Reducer<T, R, O = any> = (
  accumulator: R,
  entity: Entity<T, O>,
  index: number,
  options?: O
) => Promise<R>

export interface Entities<T, O = any> {
  update<A extends any[]> (mutator: Mutator<T, A>, ...args: A): Entities<T, O>
  assign (object: Partial<T>): Entities<T, O>
  delete (): Entities<T, O>
  commit (): Entities<T, O>,
  unwrap (options?: O): Promise<T[]>
  stream (options?: O): core.Readable
  reduce<R> (reducer: Reducer<T, R, O>, init: R, options?: O): Promise<R>
  undo (steps?: number): Entities<T, O>
  redo (steps?: number): Entities<T, O>
}

interface Context<T, O> {
  locked: boolean
  extract: (options?: O) => core.Readable
  mapper: (data: T) => Entity<T, O>
}

function createContext<T, O> (
  many: Many<T, O>,
  driver?: Driver<T, O>
): Context<T, O> {
  return {
    locked: false,
    extract: options => getMany(many, options),
    mapper: data => create(data, driver)
  }
}

function readContext<T, O> (
  many: Many<T, O>,
  driver?: Driver<T, O>
): Context<T, O> {
  return {
    locked: false,
    extract: options => getMany(many, options),
    mapper: data => read(data, driver)
  }
}

function mapContext<T, O> (
  ctx: Context<T, O>,
  mapper: (entity: Entity<T, O>) => Entity<T, O>
): Context<T, O> {
  return {
    locked: false,
    extract: ctx.extract,
    mapper: data => mapper(ctx.mapper(data))
  }
}

function updateContext<T, O, A extends any[]> (
  ctx: Context<T, O>,
  mutator: Mutator<T, A>,
  args: A
): Context<T, O> {
  return mapContext(ctx, entity => entity.update(mutator, ...args))
}

function assignContext<S, T, E, O> (
  ctx: Context<T, O>,
  object: Partial<T>
): Context<T, O> {
  return mapContext(ctx, entity => entity.assign(object))
}

function deleteContext<T, O> (ctx: Context<T, O>) {
  return mapContext(ctx, entity => entity.delete())
}

function commitContext<T, O> (ctx: Context<T, O>) {
  return mapContext(ctx, entity => entity.commit())
}

function undoContext<T, O> (ctx: Context<T, O>, steps?: number) {
  return mapContext(ctx, entity => entity.undo(steps))
}

function redoContext<T, O> (ctx: Context<T, O>, steps?: number) {
  return mapContext(ctx, entity => entity.redo(steps))
}

type Callback = (err?: any) => void

function handleContext<T, O> (
  ctx: Context<T, O>,
  options: O | undefined,
  write: (entity: Entity<T, O>, callback: Callback) => void,
  end: Callback
): void {
  pipeline(
    ctx.extract(options),
    new Writable({
      objectMode: true,
      write (data: T, encoding, callback) {
        write(ctx.mapper(data), callback)
      }
    }),
    end
  )
}

function unwrapContext<T, O> (
  ctx: Context<T, O>,
  options?: O
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const results: T[] = []
    handleContext(
      ctx,
      options,
      (entity, callback) => {
        entity.unwrap(options)
          .then(result => {
            results.push(result)
            callback()
          })
          .catch(callback)
      },
      err => {
        if (err) {
          reject(err)
        } else {
          resolve(results)
        }
      }
    )
  })
}

function streamContext<T, O> (
  ctx: Context<T, O>,
  options?: O
): core.Readable {
  let reading = false
  return new Readable({
    objectMode: true,
    read () {
      if (reading) {
        return
      }
      reading = true
      handleContext(
        ctx,
        options,
        (entity, callback) => {
          this.push({ entity, options })
          callback()
        },
        err => {
          if (err) {
            this.emit('error', err)
          } else {
            this.push(null)
          }
        }
      )
    }
  })
}

function reduceContext<T, O, R> (
  ctx: Context<T, O>,
  reducer: Reducer<T, R, O>,
  accumulator: R,
  options?: O
): Promise<R> {
  return new Promise<R>((resolve, reject) => {
    let index = 0
    handleContext(
      ctx,
      options,
      (entity, callback) => {
        reducer(accumulator, entity, index++, options)
          .then(result => {
            accumulator = result
            callback()
          })
          .catch(callback)
      },
      err => {
        if (err) {
          reject(err)
        } else {
          resolve(accumulator)
        }
      }
    )
  })
}

function lockContext<T, O> (ctx: Context<T, O>) {
  if (ctx.locked) {
    throw new Error('Those entities are immutable')
  }
  ctx.locked = true
  return ctx
}

function wrapContext<T, O> (ctx: Context<T, O>): Entities<T, O> {
  return {
    update: (mutator, ...args) => wrapContext(updateContext(lockContext(ctx), mutator, args)),
    assign: object => wrapContext(assignContext(lockContext(ctx), object)),
    delete: () => wrapContext(deleteContext(lockContext(ctx))),
    commit: () => wrapContext(commitContext(lockContext(ctx))),
    unwrap: options => unwrapContext(lockContext(ctx), options),
    stream: options => streamContext(lockContext(ctx), options),
    reduce: (reducer, init, options) => reduceContext(lockContext(ctx), reducer, init, options),
    undo: steps => wrapContext(undoContext(lockContext(ctx), steps)),
    redo: steps => wrapContext(redoContext(lockContext(ctx), steps))
  }
}

export function insert<T, O = any> (
  many: Many<T, O>,
  driver?: Driver<T, O>
): Entities<T, O> {
  return wrapContext(createContext(many, driver))
}

export function find<T, O = any> (
  many: Many<T, O>,
  driver?: Driver<T, O>
): Entities<T, O> {
  return wrapContext(readContext(many, driver))
}
