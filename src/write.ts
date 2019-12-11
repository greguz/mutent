import { Status, commitStatus } from './status'

export type Commit<O> = (source: any, target: any, options?: O) => any

export type Write<O> = <S, T>(status: Status<S, T, O>) => Promise<Status<T, T, O>>

function voidWriter<S, T, O> (status: Status<S, T, O>) {
  return Promise.resolve(commitStatus(status))
}

export function createWriter<O> (commit?: Commit<O>): Write<O> {
  if (!commit) {
    return voidWriter
  }
  return async function write<S, T> (status: Status<S, T, O>) {
    const { source, target, options } = status as any
    if (source !== target) {
      await commit(source, target, options)
    }
    return commitStatus(status)
  }
}
