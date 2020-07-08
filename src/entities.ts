import stream from 'stream'
import { Transform, Writable, pipeline, readify } from 'fluido'

import { Many, StreamOptions, UnwrapOptions, getMany } from './data'
import { Mutation, applyMutation } from './mutation'
import { isNull } from './utils'

export function unwrapMany<T, O> (
  many: Many<T, O>,
  persisted: boolean,
  mutation: Mutation<T, O>,
  options: UnwrapOptions<O>
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const results: T[] = []
    pipeline(
      getMany(many, options),
      new Writable<T>({
        objectMode: true,
        async write (chunk) {
          const out = await applyMutation(chunk, persisted, mutation, options)
          if (!isNull(out)) {
            results.push(out)
          }
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
  persisted: boolean,
  mutation: Mutation<T, O>,
  options: StreamOptions<O>
): stream.Readable {
  const streamOptions = {
    concurrency: options.concurrency,
    highWaterMark: options.highWaterMark,
    objectMode: true
  }
  return readify(
    streamOptions,
    getMany(many, options),
    new Transform({
      ...streamOptions,
      async transform (chunk) {
        const out = await applyMutation(chunk, persisted, mutation, options)
        if (!isNull(out)) {
          this.push(out)
        }
      }
    })
  )
}
