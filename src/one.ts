export type AsyncValue<T, O> = (options?: O) => Promise<T>

export type SyncValue<T, O> = (options?: O) => T

export type One<T, O> =
  | AsyncValue<T, O>
  | SyncValue<T, O>
  | Promise<T>
  | T

function extractFactory<T, O> (
  one: AsyncValue<T, O> | SyncValue<T, O>,
  options?: O
): Promise<T> {
  return Promise.resolve(one(options))
}

export function getOne<T, O> (one: One<T, O>, options?: O): Promise<T> {
  return typeof one === 'function'
    ? extractFactory(one as any, options)
    : Promise.resolve(one)
}
