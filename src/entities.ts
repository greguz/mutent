import stream from 'stream'
import { Transform, Writable, pipeline, readify } from 'fluido'

import { Many, StreamOptions, UnwrapOptions, getMany } from './data'
import { Mutator, applyMutator } from './mutator'
import { Status } from './status'

export function unwrapMany<T, O> (
  many: Many<T, O>,
  build: (data: T) => Status<T>,
  mutator: Mutator<T, O>,
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
    getMany(many, options),
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
