export type AsyncValue<T, O> = (options?: O) => Promise<T>

export type SyncValue<T, O> = (options?: O) => T

export type One<T, O> =
  | AsyncValue<T, O>
  | SyncValue<T, O>
  // TODO: deprecate this (v2)
  | Promise<T>
  | T

export async function getOne<T, O> (one: One<T, O>, options?: O): Promise<T> {
  if (typeof one === 'function') {
    return (one as any)(options)
  } else {
    return one
  }
}
