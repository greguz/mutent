import stream from 'stream'
import { Transform, Writable, pipeline, readify } from 'fluido'
import fluente from 'fluente'

import { Many, getMany } from './data'
import { Entity, Mutator, Settings, UnwrapOptions, createEntity, readEntity } from './entity'
import { isNull, mutentSymbol, objectify } from './utils'

export type StreamOptions<O = {}> = UnwrapOptions<O> & { highWaterMark?: number }

export interface Entities<T, O = any> {
  areEntities: boolean
  update<A extends any[]> (mutator: Mutator<T, A>, ...args: A): Entities<T, O>
  assign (object: Partial<T>): Entities<T, O>
  delete (): Entities<T, O>
  commit (): Entities<T, O>
  run (routine: string, ...args: any[]): Entities<T, O>
  unwrap (options?: UnwrapOptions<O>): Promise<T[]>
  stream (options?: StreamOptions<O>): stream.Readable
  undo (steps?: number): Entities<T, O>
  redo (steps?: number): Entities<T, O>
}

interface State<T, O> {
  extract (options: Partial<O>): stream.Readable
  mapper (data: T): Entity<T, O>
}

function createState<T, O> (
  many: Many<T, O>,
  settings: Settings<T, O>
): State<T, O> {
  return {
    extract: options => getMany(many, options),
    mapper: data => createEntity(data, settings)
  }
}

function readState<T, O> (
  many: Many<T, O>,
  settings: Settings<T, O>
): State<T, O> {
  return {
    extract: options => getMany(many, options),
    mapper: data => readEntity(data, settings)
  }
}

function mapState<T, O> (
  state: State<T, O>,
  mapper: (entity: Entity<T, O>) => Entity<T, O>
): State<T, O> {
  return {
    extract: state.extract,
    mapper: data => mapper(state.mapper(data))
  }
}

function updateMethod<T, O, A extends any[]> (
  state: State<T, O>,
  mutator: Mutator<T, A>,
  ...args: A
): State<T, O> {
  return mapState(state, entity => entity.update(mutator, ...args))
}

function assignMethod<T, O> (
  state: State<T, O>,
  object: Partial<T>
): State<T, O> {
  return mapState(state, entity => entity.assign(object))
}

function deleteMethod<T, O> (state: State<T, O>) {
  return mapState(state, entity => entity.delete())
}

function commitMethod<T, O> (state: State<T, O>) {
  return mapState(state, entity => entity.commit())
}

function runMethod<T, O> (state: State<T, O>, key: string, ...args: any[]) {
  return mapState(state, entity => entity.run(key, ...args))
}

function unwrapMethod<T, O> (
  state: State<T, O>,
  options?: UnwrapOptions<O>
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const results: T[] = []
    pipeline(
      state.extract(objectify(options)),
      new Writable({
        objectMode: true,
        write (chunk, encoding, callback) {
          state.mapper(chunk)
            .unwrap(options)
            .then(data => {
              if (!isNull(data)) {
                results.push(data)
              }
              callback()
            })
            .catch(callback)
        }
      }),
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

function streamMethod<T, O> (
  state: State<T, O>,
  options?: StreamOptions<O>
): stream.Readable {
  const obj = objectify(options)
  const streamOptions = {
    objectMode: true,
    highWaterMark: obj.highWaterMark
  }
  return readify(
    streamOptions,
    state.extract(obj),
    new Transform({
      ...streamOptions,
      transform (chunk, encoding, callback) {
        state.mapper(chunk)
          .unwrap(options)
          .then(data => {
            if (!isNull(data)) {
              this.push(data)
            }
            callback()
          })
          .catch(callback)
      }
    })
  )
}

function wrapState<T, O> (
  state: State<T, O>,
  settings: Settings<T, O>
): Entities<T, O> {
  return fluente({
    state,
    fluent: {
      update: updateMethod,
      assign: assignMethod,
      delete: deleteMethod,
      commit: commitMethod,
      run: runMethod
    },
    methods: {
      unwrap: unwrapMethod,
      stream: streamMethod
    },
    constants: {
      [mutentSymbol]: true,
      areEntities: true
    },
    historySize: settings.historySize,
    sharedState: settings.classy === true
  })
}

export function areEntities (value: any): value is Entities<any, any> {
  return typeof value === 'object' && value !== null
    ? value[mutentSymbol] === true && value.areEntities === true
    : false
}

export function createEntities<T, O = any> (
  many: Many<T, O>,
  settings: Settings<T, O> = {}
): Entities<T, O> {
  return wrapState(createState(many, settings), settings)
}

export function readEntities<T, O = any> (
  many: Many<T, O>,
  settings: Settings<T, O> = {}
): Entities<T, O> {
  return wrapState(readState(many, settings), settings)
}
