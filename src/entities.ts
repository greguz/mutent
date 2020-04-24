import core from 'stream'
import { Readable, Writable, pipeline } from 'readable-stream'
import fluente from 'fluente'

import { Many, getMany } from './data'
import { Entity, Mutator, Settings, createEntity, readEntity } from './entity'
import { isNull, objectify } from './utils'

export interface Entities<T, O = any> {
  areEntities: boolean
  update<A extends any[]> (mutator: Mutator<T, A>, ...args: A): Entities<T, O>
  assign (object: Partial<T>): Entities<T, O>
  delete (): Entities<T, O>
  commit (): Entities<T, O>,
  unwrap (options?: O): Promise<T[]>
  stream (options?: O): core.Readable
  undo (steps?: number): Entities<T, O>
  redo (steps?: number): Entities<T, O>
}

interface State<T, O> {
  extract: (options: Partial<O>) => core.Readable
  mapper: (data: T) => Entity<T, O>
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

function updateState<T, O, A extends any[]> (
  state: State<T, O>,
  mutator: Mutator<T, A>,
  ...args: A
): State<T, O> {
  return mapState(state, entity => entity.update(mutator, ...args))
}

function assignState<T, O> (
  state: State<T, O>,
  object: Partial<T>
): State<T, O> {
  return mapState(state, entity => entity.assign(object))
}

function deleteState<T, O> (state: State<T, O>) {
  return mapState(state, entity => entity.delete())
}

function commitState<T, O> (state: State<T, O>) {
  return mapState(state, entity => entity.commit())
}

type Callback = (err?: any) => void

function handleState<T, O> (
  state: State<T, O>,
  options: O | undefined,
  write: (data: T, callback: Callback) => void,
  end: Callback
) {
  return pipeline(
    state.extract(objectify(options)),
    new Writable({
      objectMode: true,
      write (data: T, encoding, callback) {
        state.mapper(data)
          .unwrap(options)
          .then(data => {
            if (isNull(data)) {
              callback()
            } else {
              write(data, callback)
            }
          })
          .catch(callback)
      }
    }),
    end
  )
}

function unwrapState<T, O> (
  state: State<T, O>,
  options?: O
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const results: T[] = []
    handleState(
      state,
      options,
      (data, callback) => {
        results.push(data)
        callback()
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

function streamState<T, O> (
  state: State<T, O>,
  options?: O
): core.Readable {
  let reading = false
  let next: Callback | undefined
  let tail: Writable | undefined
  return new Readable({
    objectMode: true,
    read () {
      if (next) {
        const callback = next
        next = undefined
        callback()
      }

      if (reading) {
        return
      }
      reading = true

      tail = handleState(
        state,
        options,
        (data, callback) => {
          if (this.push(data)) {
            callback()
          } else {
            next = callback
          }
        },
        err => {
          if (err) {
            this.emit('error', err)
          } else {
            this.push(null)
          }
        }
      )
    },
    destroy (err, callback) {
      if (tail) {
        tail.destroy(err as any)
      }
      callback(err)
    }
  })
}

function wrapState<T, O> (
  state: State<T, O>,
  settings: Settings<T, O>
): Entities<T, O> {
  return fluente({
    state,
    fluent: {
      update: updateState,
      assign: assignState,
      delete: deleteState,
      commit: commitState
    },
    methods: {
      unwrap: unwrapState,
      stream: streamState
    },
    constants: {
      [Symbol.for('mutent')]: true,
      areEntities: true
    },
    historySize: settings.historySize,
    sharedState: settings.mutable === true
  })
}

export function areEntities (value: any): value is Entities<any, any> {
  return typeof value === 'object' && value !== null
    ? value[Symbol.for('mutent')] === true && value.areEntities === true
    : false
}

export function insertEntities<T, O = any> (
  many: Many<T, O>,
  settings: Settings<T, O> = {}
): Entities<T, O> {
  return wrapState(createState(many, settings), settings)
}

export function findEntities<T, O = any> (
  many: Many<T, O>,
  settings: Settings<T, O> = {}
): Entities<T, O> {
  return wrapState(readState(many, settings), settings)
}
