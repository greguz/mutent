import stream from 'stream'
import {
  Readable,
  Transform,
  Writable,
  isReadable,
  pipeline,
  readify
} from 'fluido'

import { Status } from './status'
import { MutationTree, mutateStatus } from './tree'
import { Lazy, isNull, unlazy } from './utils'
import { WritableSettings, WritableOptions, ensureSafeStatus } from './writer'

export type Value<T> = Promise<T> | T

export type Values<T> = Iterable<T> | AsyncIterable<T> | stream.Readable

export type StreamOptions<O = {}> = WritableOptions<O> & {
  concurrency?: number
  highWaterMark?: number
}

export type One<T, O = any> = Lazy<Value<T>, StreamOptions<O>>

export type Many<T, O = any> = Lazy<Values<T>, StreamOptions<O>>

async function getValue<T> (value: Value<T>): Promise<T> {
  return value
}

function getValues<T> (values: Values<T>): stream.Readable {
  return isReadable(values) ? values : Readable.from(values)
}

async function mutate<T, O> (
  status: Status<T>,
  mutation: MutationTree<T>,
  settings: WritableSettings<T, O>,
  options: WritableOptions<O>
): Promise<T> {
  if (isNull(status.target)) {
    return status.target
  }
  status = await mutateStatus(status, mutation, settings.writer, options)
  status = await ensureSafeStatus(status, settings, options)
  return status.target
}

export async function unwrapOne<T, O> (
  one: One<T, O>,
  build: (data: T) => Status<T>,
  mutation: MutationTree<T>,
  settings: WritableSettings<T, O>,
  options: WritableOptions<O>
): Promise<T> {
  const data = await getValue(unlazy(one, options))
  return mutate(build(data), mutation, settings, options)
}

export function streamOne<T, O> (
  one: One<T, O>,
  build: (data: T) => Status<T>,
  mutation: MutationTree<T>,
  settings: WritableSettings<T, O>,
  options: StreamOptions<O>
): stream.Readable {
  return new Readable({
    objectMode: true,
    async asyncRead () {
      const data = await getValue(unlazy(one, options))
      const out = await mutate(build(data), mutation, settings, options)
      if (!isNull(out)) {
        this.push(out)
      }
      this.push(null)
    }
  })
}

export function unwrapMany<T, O> (
  many: Many<T, O>,
  build: (data: T) => Status<T>,
  mutation: MutationTree<T>,
  settings: WritableSettings<T, O>,
  options: WritableOptions<O>
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const results: T[] = []
    pipeline(
      getValues(unlazy(many, options)),
      new Writable<T>({
        objectMode: true,
        async write (chunk) {
          results.push(
            await mutate(build(chunk), mutation, settings, options)
          )
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

export function streamMany<T, O> (
  many: Many<T, O>,
  build: (data: T) => Status<T>,
  mutation: MutationTree<T>,
  settings: WritableSettings<T, O>,
  options: StreamOptions<O>
): stream.Readable {
  return readify(
    {
      highWaterMark: options.highWaterMark,
      objectMode: true
    },
    getValues(unlazy(many, options)),
    new Transform<T, T>({
      concurrency: options.concurrency,
      highWaterMark: options.highWaterMark,
      objectMode: true,
      async transform (chunk) {
        this.push(
          await mutate(build(chunk), mutation, settings, options)
        )
      }
    })
  )
}
