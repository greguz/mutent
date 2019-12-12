import { Status, commitStatus } from './status'

export type Commit<O> = (source: any, target: any, options?: O) => any

export type Write<O> = <S, T>(status: Status<S, T, O>) => Promise<Status<T, T, O>>

function passthrough<S, T, O> (status: Status<S, T, O>) {
  return Promise.resolve(status)
}

function runCommit<S, T, O> (commit: Commit<O>, status: Status<S, T, O>) {
  return Promise.resolve(commit(status.source, status.target, status.options)).then(() => status)
}

function write<S, T, O> (status: Status<S, T, O>, commit?: Commit<O>) {
  return commit && (status as any).source !== status.target
    ? runCommit(commit, status)
    : passthrough(status)
}

export function createWriter<O> (commit?: Commit<O>): Write<O> {
  return status => write(status, commit).then(commitStatus)
}
