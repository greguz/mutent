import stream from 'stream'
import {
  Readable,
  Transform,
  Writable,
  isReadable,
  pipeline,
  readify
} from 'fluido'

import { Mutator, applyMutator } from './mutator'
import { Status } from './status'
import { Lazy, isNull, unlazy } from './utils'

export type Value<T> = Promise<T> | T

export type Values<T> = Iterable<T> | AsyncIterable<T> | stream.Readable

export type UnwrapOptions<O = {}> = Partial<O> & {
  autoCommit?: boolean
  safe?: boolean
}

export type StreamOptions<O = {}> = UnwrapOptions<O> & {
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

export async function unwrapOne<T, O> (
  one: One<T, O>,
  build: (data: T) => Status<T>,
  mutator: Mutator<T, O>,
  options: UnwrapOptions<O>
): Promise<T> {
  const data = await getValue(unlazy(one, options))
  return applyMutator(build(data), mutator, options)
}

export function streamOne<T, O> (
  one: One<T, O>,
  build: (data: T) => Status<T>,
  mutator: Mutator<T, O>,
  options: StreamOptions<O>
): stream.Readable {
  return new Readable({
    objectMode: true,
    async asyncRead () {
      const data = await getValue(unlazy(one, options))
      const out = await applyMutator(build(data), mutator, options)
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
  mutator: Mutator<T, O>,
  options: UnwrapOptions<O>
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const results: T[] = []
    pipeline(
      getValues(unlazy(many, options)),
      new Writable<T>({
        objectMode: true,
        async write (chunk) {
          results.push(
            await applyMutator(build(chunk), mutator, options)
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
  mutator: Mutator<T, O>,
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
          await applyMutator(build(chunk), mutator, options)
        )
      }
    })
  )
}
