import stream from 'stream'
import {
  Readable,
  Transform,
  Writable,
  isReadable,
  pipeline,
  readify
} from 'fluido'

import { Lazy, isNull, unlazy } from './utils'

export type Value<T> = Promise<T> | T

export type Values<T> = Iterable<T> | AsyncIterable<T> | stream.Readable

export type One<T, O = any> = Lazy<Value<T>, StreamOptions<O>>

export type Many<T, O = any> = Lazy<Values<T>, StreamOptions<O>>

export type UnwrapOptions<O = {}> = Partial<O> & {
  autoCommit?: boolean
  safe?: boolean
}

export type StreamOptions<O = {}> = UnwrapOptions<O> & {
  concurrency?: number
  highWaterMark?: number
}

export async function unwrapOne<T, O> (
  one: One<T, O>,
  handle: (data: T, options: UnwrapOptions<O>) => Promise<T>,
  options: UnwrapOptions<O>
): Promise<T> {
  return handle(
    await unlazy(one, options),
    options
  )
}

export function streamOne<T, O> (
  one: One<T, O>,
  handle: (data: T, options: StreamOptions<O>) => Promise<T>,
  options: StreamOptions<O>
): stream.Readable {
  return new Readable({
    objectMode: true,
    async asyncRead () {
      const data = await unwrapOne(one, handle, options)
      if (!isNull(data)) {
        this.push(data)
      }
      this.push(null)
    }
  })
}

function toStream<T> (values: Values<T>): stream.Readable {
  return isReadable(values) ? values : Readable.from(values)
}

export function unwrapMany<T, O> (
  many: Many<T, O>,
  handle: (data: T, options: UnwrapOptions<O>) => Promise<T>,
  options: UnwrapOptions<O>
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const results: T[] = []
    pipeline(
      toStream(unlazy(many, options)),
      new Writable<T>({
        objectMode: true,
        async write (chunk) {
          results.push(
            await handle(chunk, options)
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
  handle: (data: T, options: StreamOptions<O>) => Promise<T>,
  options: StreamOptions<O>
): stream.Readable {
  return readify(
    {
      highWaterMark: options.highWaterMark,
      objectMode: true
    },
    toStream(unlazy(many, options)),
    new Transform<T, T>({
      concurrency: options.concurrency,
      highWaterMark: options.highWaterMark,
      objectMode: true,
      async transform (chunk) {
        this.push(
          await handle(chunk, options)
        )
      }
    })
  )
}
