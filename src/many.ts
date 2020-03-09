import { Readable, Writable, pipeline } from 'readable-stream'
import stream from 'stream'

export type SyncReadable<O> = (options?: O) => stream.Readable

export type SyncArray<T, O> = (options?: O) => T[]

export type AsyncReadable<O> = (options?: O) => Promise<stream.Readable>

export type AsyncArray<T, O> = (options?: O) => Promise<T[]>

export type Many<T, O> =
  | SyncReadable<O>
  | SyncArray<T, O>
  | AsyncReadable<O>
  | AsyncArray<T, O>
  | Readable
  | T[]

function readArray (arr: any[]) {
  let index = 0
  return new Readable({
    objectMode: true,
    read () {
      let flowing = true
      while (flowing && index < arr.length) {
        flowing = this.push(arr[index++])
      }
      if (index >= arr.length) {
        this.push(null)
      }
    }
  })
}

function pipeReadable (
  target: Readable,
  source: stream.Readable,
  end: (err?: any) => void
) {
  pipeline(
    source,
    new Writable({
      objectMode: true,
      write (chunk, encoding, callback) {
        target.push(chunk, encoding)
        callback()
      }
    }),
    end
  )
}

function pipeArray (
  target: Readable,
  source: any[],
  end: (err?: any) => void
) {
  pipeReadable(target, readArray(source), end)
}

function pipeSource (
  target: Readable,
  source: stream.Readable | any[],
  end: (err?: any) => void
) {
  if (Array.isArray(source)) {
    pipeArray(target, source, end)
  } else {
    pipeReadable(target, source, end)
  }
}

function wrapFunction<T, O> (
  source: SyncReadable<O> | SyncArray<T, O> | AsyncReadable<O> | AsyncArray<T, O>,
  options?: O
): Readable {
  let reading = false
  return new Readable({
    objectMode: true,
    read () {
      if (reading) {
        return
      }
      reading = true

      const end = (err?: any) => {
        if (err) {
          process.nextTick(() => this.emit('error', err))
        } else {
          this.push(null)
        }
      }

      const item = source(options)
      if (item instanceof Promise) {
        (item as Promise<any>)
          .then(subItem => pipeSource(this, subItem, end))
          .catch(end)
      } else {
        pipeSource(this, item, end)
      }
    }
  })
}

export function getMany<T, O> (
  many: Many<T, O>,
  options?: O
): Readable {
  if (Array.isArray(many)) {
    return readArray(many)
  } else if (typeof many === 'function') {
    return wrapFunction(many, options)
  } else {
    return many
  }
}
