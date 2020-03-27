import core from 'stream'
import { Stream, Readable, Writable, pipeline } from 'readable-stream'

export type Value<T> =
  | Promise<T>
  | T

export type Values<T> =
  | Promise<core.Readable>
  | Promise<T[]>
  | core.Readable
  | T[]
  | Iterable<T>
  | AsyncIterable<T>

export type Lazy<T, O = unknown, C = unknown> = ((this: C, options?: O) => T) | T

export type One<T, O = unknown, C = unknown> = Lazy<Value<T>, O, C>

export type Many<T, O = unknown, C = unknown> = Lazy<Values<T>, O, C>

function handlePromise (promise: Promise<any>) {
  promise = promise
    .then(result => ({
      status: 'FULFILLED',
      result
    }))
    .catch(error => ({
      status: 'REJECTED',
      error
    }))

  let reading: boolean = false
  let resume: any
  return new Readable({
    highWaterMark: 16,
    objectMode: true,
    read () {
      if (resume) {
        const fn = resume
        resume = undefined
        fn()
      }
      if (reading) {
        return
      }
      reading = true

      const self = this

      function closeStream (err?: any) {
        if (err) {
          process.nextTick(() => self.emit('error', err))
        } else {
          self.push(null)
        }
      }

      function handleFulfillment (result: any) {
        pipeline(
          Array.isArray(result)
            ? Readable.from(result)
            : result,
          new Writable({
            objectMode: true,
            write (chunk, encoding, callback) {
              if (self.push(chunk, encoding)) {
                callback()
              } else {
                resume = callback
              }
            }
          }),
          closeStream
        )
      }

      promise
        .then(({ status, result, error }) => {
          if (status === 'FULFILLED') {
            handleFulfillment(result)
          } else {
            closeStream(error)
          }
        })
        .catch(closeStream)
    }
  })
}

export function getMany<T, O, C> (
  context: C,
  many: Many<T, O, C>,
  options?: O
): core.Readable {
  if (typeof many === 'function') {
    return getMany(context, many.call(context, options))
  } else if (many instanceof Stream) {
    return many
  } else if (many instanceof Promise) {
    return handlePromise(many)
  } else {
    return Readable.from(many)
  }
}

export function getOne<T, O, C> (
  context: C,
  one: One<T, O, C>,
  options?: O
): Promise<T> {
  if (typeof one === 'function') {
    return getOne(context, (one as any).call(context, options))
  } else {
    return Promise.resolve(one)
  }
}
