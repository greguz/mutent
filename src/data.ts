import cs from 'stream'
import gs from 'readable-stream'

export type Lazy<T, O> = ((options?: O) => T) | T

export type Value<T> =
  | Promise<T>
  | T

export type Values<T> =
  | Promise<cs.Readable>
  | Promise<T[]>
  | cs.Readable
  | T[]
  | Iterable<T>
  | AsyncIterable<T>

export type One<T, O> = Lazy<Value<T>, O>

export type Many<T, O> = Lazy<Values<T>, O>

function pipeReadable (
  target: cs.Readable,
  source: cs.Readable,
  end: (err?: any) => void
) {
  gs.pipeline(
    source,
    new gs.Writable({
      objectMode: true,
      write (chunk, encoding, callback) {
        target.push(chunk, encoding)
        callback()
      }
    }),
    end
  )
}

function handlePromise<T> (promise: Promise<any>) {
  promise = promise
    .then(result => ({
      status: 'FULFILLED',
      result
    }))
    .catch(error => ({
      status: 'REJECTED',
      error
    }))

  let reading = false
  return new gs.Readable({
    objectMode: true,
    read () {
      if (reading) {
        return
      }
      reading = true

      const closeStream = (err?: any) => {
        if (err) {
          process.nextTick(() => this.emit('error', err))
        } else {
          this.push(null)
        }
      }

      const handleFulfillment = (result: any) => {
        pipeReadable(
          this,
          Array.isArray(result)
            ? gs.Readable.from(result)
            : result,
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

export function getMany<T, O> (
  many: Many<T, O>,
  options?: O
): cs.Readable {
  if (typeof many === 'function') {
    return getMany(many.call(null, options))
  } else if (many instanceof cs.Stream) {
    return many
  } else if (many instanceof Promise) {
    return handlePromise(many)
  } else {
    return gs.Readable.from(many)
  }
}

export function getOne<T, O> (
  one: One<T, O>,
  options?: O
): Promise<T> {
  if (typeof one === 'function') {
    return getOne((one as any).call(null, options))
  } else {
    return Promise.resolve(one)
  }
}
