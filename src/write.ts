import { Status, commitStatus } from './status'

export type Commit<O> = (source: any, target: any, options?: O) => any

export type Write<O> = <S, T>(status: Status<S, T>, options?: O) => Promise<Status<T, T>>

function passthrough<S, T> (status: Status<S, T>) {
  return Promise.resolve(status)
}

function runCommit<S, T, O> (commit: Commit<O>, status: Status<S, T>, options?: O) {
  return Promise.resolve(commit(status.source, status.target, options)).then(() => status)
}

function write<S, T, O> (status: Status<S, T>, commit?: Commit<O>, options?: O) {
  return commit && (status as any).source !== status.target
    ? runCommit(commit, status, options)
    : passthrough(status)
}

export function createWriter<O> (commit?: Commit<O>): Write<O> {
  return (status, options) => write(status, commit, options).then(commitStatus)
}
