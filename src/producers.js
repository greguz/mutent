import {
  Readable,
  Transform,
  Writable,
  isReadable,
  pipeline,
  readify
} from 'fluido'

import { isNull } from './utils'

export async function unwrapOne(value, mutate) {
  return mutate(await value)
}

export function streamOne(one, mutate) {
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

function toStream(values) {
  return isReadable(values) ? values : Readable.from(values)
}

export function unwrapMany(values, mutate) {
  return new Promise((resolve, reject) => {
    const results = []
    pipeline(
      toStream(values),
      new Writable({
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

export function streamMany(values, mutate, options = {}) {
  return readify(
    {
      highWaterMark: options.highWaterMark,
      objectMode: true
    },
    toStream(values),
    new Transform({
      concurrency: options.concurrency,
      highWaterMark: options.highWaterMark,
      objectMode: true,
      async transform(chunk) {
        this.push(await mutate(chunk))
      }
    })
  )
}
