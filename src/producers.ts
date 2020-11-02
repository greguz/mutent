import stream from 'stream'
import {
  Readable,
  Transform,
  Writable,
  isReadable,
  pipeline,
  readify
} from 'fluido'

import { Value, Values } from './driver/index'
import { isNull } from './utils'

export type UnwrapOptions<O = {}> = Partial<O> & {
  autoCommit?: boolean
  safe?: boolean
}

export type StreamOptions<O = {}> = UnwrapOptions<O> & {
  concurrency?: number
  highWaterMark?: number
}

export async function unwrapOne<T, O>(
  value: Value<T>,
  mutate: (data: any) => Promise<T>
): Promise<T> {
  return mutate(await value)
}

export function streamOne<T, O>(
  one: Value<T>,
  mutate: (data: any) => Promise<T>
): stream.Readable {
  return new Readable({
    objectMode: true,
    async asyncRead() {
      const data = await unwrapOne(one, mutate)
      if (!isNull(data)) {
        this.push(data)
      }
      this.push(null)
    }
  })
}

function toStream<T>(values: Values<T>): stream.Readable {
  return isReadable(values) ? values : Readable.from(values)
}

export function unwrapMany<T, O>(
  values: Values<T>,
  mutate: (data: any) => Promise<T>
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const results: T[] = []
    pipeline(
      toStream(values),
      new Writable<T>({
        objectMode: true,
        async write(chunk) {
          results.push(await mutate(chunk))
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

export function streamMany<T, O>(
  values: Values<T>,
  mutate: (data: any) => Promise<T>,
  options: StreamOptions<O>
): stream.Readable {
  return readify(
    {
      highWaterMark: options.highWaterMark,
      objectMode: true
    },
    toStream(values),
    new Transform<T, T>({
      concurrency: options.concurrency,
      highWaterMark: options.highWaterMark,
      objectMode: true,
      async transform(chunk) {
        this.push(await mutate(chunk))
      }
    })
  )
}
