import { Status, createStatus } from './status'

export type AsyncFactory<T, O> = (options?: O) => Promise<T>

export type SyncFactory<T, O> = (options?: O) => T

export type Factory<T, O> = AsyncFactory<T, O> | SyncFactory<T, O>

export type Source<T, O> = Factory<T, O> | T

export type Read<T, O> = (options?: O) => Promise<Status<null, T, O>>

function extractFactory<T, O> (
  factory: Factory<T, O>,
  options?: O
): Promise<T> {
  return Promise.resolve(factory(options))
}

function extractSource<T, O> (source: Source<T, O>, options?: O): Promise<T> {
  return typeof source === 'function'
    ? extractFactory(source as any, options)
    : Promise.resolve(source)
}

function extractStatus<T, O> (
  source: Source<T, O>,
  options?: O
): Promise<Status<null, T, O>> {
  return extractSource(source, options).then(
    target => createStatus(target, options)
  )
}

export function createReader<T, O> (
  source: Source<T, O>
): Read<T, O> {
  return options => extractStatus(source, options)
}
