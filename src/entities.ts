import core from 'stream'
import { Readable, Writable, pipeline } from 'readable-stream'

import { Many, getMany } from './data'
import { Entity, Mutator, create, read } from './entity'
import { Driver } from './handler'

export type Reducer<T, R, O = unknown> = (
  accumulator: R,
  entity: Entity<T, O>,
  index: number,
  options?: O
) => Promise<R>

export interface Entities<T, O = unknown> {
  update<U, A extends any[]> (mutator: Mutator<T, U, A>, ...args: A): Entities<U, O>
  assign<E> (object: E): Entities<T & E, O>
  delete (): Entities<null, O>
  commit (): Entities<T, O>,
  unwrap (options?: O): Promise<T[]>
  stream (options?: O): core.Readable
  reduce<R> (reducer: Reducer<T, R, O>, init: R, options?: O): Promise<R>
}

interface State<S, T, O> {
  extract: (options?: O) => core.Readable
  locked: boolean
  mapper: (data: S) => Entity<T, O>
}

function createState<T, O, C> (
  context: any = {},
  many: Many<T, O, C>,
  driver?: Driver<O, C>
): State<T, T, O> {
  return {
    extract: options => getMany(context, many, options),
    locked: false,
    mapper: data => create(data, driver)
  }
}

function readState<T, O, C> (
  context: any = {},
  many: Many<T, O, C>,
  driver?: Driver<O, C>
): State<T, T, O> {
  return {
    extract: options => getMany(context, many, options),
    locked: false,
    mapper: data => read(data, driver)
  }
}

function mapState<S, T, U, O> (
  state: State<S, T, O>,
  mapper: (entity: Entity<T, O>) => Entity<U, O>
): State<S, U, O> {
  return {
    locked: false,
    extract: state.extract,
    mapper: (data: S) => mapper(state.mapper(data))
  }
}

function updateState<S, T, O, U, A extends any[]> (
  state: State<S, T, O>,
  mutator: Mutator<T, U, A>,
  args: A
): State<S, U, O> {
  return mapState(state, entity => entity.update(mutator, ...args))
}

function assignState<S, T, E, O> (
  state: State<S, T, O>,
  object: E
): State<S, T & E, O> {
  return mapState(state, entity => entity.assign(object))
}

function deleteState<S, T, O> (
  state: State<S, T, O>
): State<S, null, O> {
  return mapState(state, entity => entity.delete())
}

function commitState<S, T, O> (
  state: State<S, T, O>
): State<S, T, O> {
  return mapState(state, entity => entity.commit())
}

type Callback = (err?: any) => void

function handleState<S, T, O> (
  state: State<S, T, O>,
  options: O | undefined,
  write: (entity: Entity<T, O>, callback: Callback) => void,
  end: Callback
): void {
  pipeline(
    state.extract(options),
    new Writable({
      objectMode: true,
      write (data: S, encoding, callback) {
        write(state.mapper(data), callback)
      }
    }),
    end
  )
}

function unwrapState<S, T, O> (
  state: State<S, T, O>,
  options?: O
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const results: T[] = []
    handleState(
      state,
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

function streamState<S, T, O> (
  state: State<S, T, O>,
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
      handleState(
        state,
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

function reduceState<S, T, O, R> (
  ctx: State<S, T, O>,
  reducer: Reducer<T, R, O>,
  accumulator: R,
  options?: O
): Promise<R> {
  return new Promise<R>((resolve, reject) => {
    let index = 0
    handleState(
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

function lockState<S, T, O> (state: State<S, T, O>) {
  if (state.locked) {
    throw new Error('Those entities are immutable')
  }
  state.locked = true
  return state
}

function wrapState<S, T, O> (state: State<S, T, O>): Entities<T, O> {
  return {
    update: (mutator, ...args) => wrapState(updateState(lockState(state), mutator, args)),
    assign: object => wrapState(assignState(lockState(state), object)),
    delete: () => wrapState(deleteState(lockState(state))),
    commit: () => wrapState(commitState(lockState(state))),
    unwrap: options => unwrapState(lockState(state), options),
    stream: options => streamState(lockState(state), options),
    reduce: (reducer, init, options) => reduceState(lockState(state), reducer, init, options)
  }
}

export function insert<T, O = unknown, C = unknown> (
  many: Many<T, O, C>,
  driver?: Driver<O, C>,
  context?: C
): Entities<T, O> {
  return wrapState(createState(context, many, driver))
}

export function find<T, O = unknown, C = unknown> (
  many: Many<T, O, C>,
  driver?: Driver<O, C>,
  context?: C
): Entities<T, O> {
  return wrapState(readState(context, many, driver))
}
