import { Status, createStatus } from './status'

export type AsyncFactory<T, O> = (options?: O) => Promise<T>

export type SyncFactory<T, O> = (options?: O) => T

export type Factory<T, O> = AsyncFactory<T, O> | SyncFactory<T, O>

export type Source<T, O> = Factory<T, O> | T

export type Read<T, O> = (options?: O) => Promise<Status<null, T, O>>

async function extractFactory<D, O> (
  factory: Factory<D, O>,
  options?: O
): Promise<D> {
  return factory(options)
}

function extractSource<D, O> (source: Source<D, O>, options?: O): Promise<D> {
  return typeof source === 'function'
    ? extractFactory(source as any, options)
    : Promise.resolve(source)
}

function extractStatus<S, O> (
  source: Source<S, O>,
  options?: O
): Promise<Status<null, S, O>> {
  return extractSource(source, options).then(target => createStatus(target, options))
}

export function createReader<T, O> (
  source: Source<T, O>
): Read<T, O> {
  return options => extractStatus(source, options)
}
