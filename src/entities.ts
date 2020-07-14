import stream from 'stream'
import { Transform, Writable, pipeline, readify } from 'fluido'

import { Many, StreamOptions, UnwrapOptions, getMany } from './data'
import { Mutation, applyMutation } from './mutation'

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
          results.push(
            await applyMutation(chunk, persisted, mutation, options)
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
        this.push(
          await applyMutation(chunk, persisted, mutation, options)
        )
      }
    })
  )
}
