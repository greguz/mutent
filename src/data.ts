import core from 'stream'
import { Readable, Stream } from 'readable-stream'

export type Lazy<T, O = any> = ((options?: O) => T) | T

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
  options?: O
): core.Readable {
  if (typeof many === 'function') {
    return getMany(many.call(null, options))
  } else if (many instanceof Stream) {
    return many
  } else {
    return Readable.from(many)
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
