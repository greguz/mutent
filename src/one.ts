import { Status, createStatus } from './status'

export type AsyncFactory<T, O> = (options?: O) => Promise<T>

export type SyncFactory<T, O> = (options?: O) => T

export type Factory<T, O> = AsyncFactory<T, O> | SyncFactory<T, O>

export type One<T, O> = Factory<T, O> | T

export type Read<T, O> = (options?: O) => Promise<Status<null, T>>

function extractFactory<T, O> (
  one: Factory<T, O>,
  options?: O
): Promise<T> {
  return Promise.resolve(one(options))
}

function extractSource<T, O> (one: One<T, O>, options?: O): Promise<T> {
  return typeof one === 'function'
    ? extractFactory(one as any, options)
    : Promise.resolve(one)
}

function extractStatus<T, O> (
  one: One<T, O>,
  options?: O
): Promise<Status<null, T>> {
  return extractSource(one, options).then(target => createStatus(target))
}

export function createReader<T, O> (
  one: One<T, O>
): Read<T, O> {
  return options => extractStatus(one, options)
}
