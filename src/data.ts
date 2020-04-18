import core from 'stream'
import { Readable, Stream } from 'readable-stream'

import { objectify } from './options'

export type Lazy<T, O = any> = ((options: Partial<O>) => T) | T

export type Value<T> =
  | Promise<T>
  | T

export type Values<T> =
  | core.Readable
  | T[]
  | Iterable<T>
  | AsyncIterable<T>

export type One<T, O = any> = Lazy<Value<T>, O>

export type Many<T, O = any> = Lazy<Values<T>, O>

export function getMany<T, O> (
  many: Many<T, O>,
  options: Partial<O> = {}
): core.Readable {
  if (typeof many === 'function') {
    return getMany(many(objectify(options)), options)
  } else if (many instanceof Stream) {
    return many
  } else {
    return Readable.from(many)
  }
}

export function getOne<T, O> (
  one: One<T, O>,
  options: Partial<O> = {}
): Promise<T> {
  if (typeof one === 'function') {
    return getOne((one as any).call(null, objectify(options)), options)
  } else {
    return Promise.resolve(one)
  }
}
