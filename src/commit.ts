import { Status, commitStatus } from './status'

export type Commit<O> = (source: any, target: any, options?: O) => any

export function applyCommit<S, T, O> (
  status: Status<S, T>,
  commit?: Commit<O>,
  options?: O
): Promise<Status<T, T>> {
  if (commit) {
    return Promise.resolve(commit(status.source, status.target, options)).then(
      () => commitStatus(status)
    )
  } else {
    return Promise.resolve(commitStatus(status))
  }
}
