import core from 'stream'
import { Readable, Stream } from 'readable-stream'

import { objectify } from './utils'

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

function unlazy<T, O> (lazy: Lazy<T, O>, options: Partial<O>): T {
  return typeof lazy === 'function'
    ? (lazy as any)(objectify(options))
    : lazy
}

function getValue<T> (value: Value<T>) {
  return Promise.resolve(value)
}

function getValues<T> (values: Values<T>) {
  return values instanceof Stream
    ? values
    : Readable.from(values)
}

export function getOne<T, O> (
  one: One<T, O>,
  options: Partial<O> = {}
): Promise<T> {
  return getValue(unlazy(one, options))
}

export function getMany<T, O> (
  many: Many<T, O>,
  options: Partial<O> = {}
): core.Readable {
  return getValues(unlazy(many, options))
}
