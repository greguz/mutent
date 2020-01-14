import { Readable } from 'stream'

export type AsyncReadable<O> = (options?: O) => Promise<Readable>

export type AsyncArray<T, O> = (options?: O) => Promise<T[]>

export type SyncReadable<O> = (options?: O) => Readable

export type SyncArray<T, O> = (options?: O) => T[]

export type Many<T, O> =
  | AsyncReadable<O>
  | AsyncArray<T, O>
  | SyncReadable<O>
  | SyncArray<T, O>
  | Readable
  | T[]

function wrapArray (arr: any[]) {
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

export function getMany<T, O> (
  many: Many<T, O>,
  options?: O
): Promise<Readable> {
  if (Array.isArray(many)) {
    return Promise.resolve(wrapArray(many))
  } else if (typeof many === 'function') {
    return Promise.resolve(many(options)).then(getMany)
  } else {
    return Promise.resolve(many)
  }
}
