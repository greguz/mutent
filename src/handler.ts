import { deleteValue, isDeleted } from './deleted'
import { Status, commitStatus, updateStatus } from './status'

export interface Driver<T, O = any> {
  create? (target: T, options?: O): Promise<T | void>
  update? (source: T, target: T, options?: O): Promise<T | void>
  delete? (source: T, options?: O): Promise<T | void>
}

export type Handler<T, O> = (status: Status<T>, options?: O) => Promise<Status<T>>

type Commit<T, O = any> = (
  source: T | null,
  target: T,
  options?: O
) => Promise<T | void>

function shouldCommit<T> (status: Status<T>) {
  const source = status.source
  const target = isDeleted(status.target) ? null : status.target
  return source !== target
}

async function execCommit<T, O> (
  commit: Commit<T, O>,
  status: Status<T>,
  options?: O
): Promise<Status<T>> {
  if (shouldCommit(status)) {
    const out = await commit(status.source, status.target, options)
    if (out !== undefined) {
      status = updateStatus(
        status,
        isDeleted(status.target) ? deleteValue(out) : out
      )
    }
  }
  return commitStatus(status)
}

function noop (): Promise<void> {
  return Promise.resolve()
}

function compileDriver<T, O> (plugin: Driver<T, O>): Commit<T, O> {
  const pCreate = plugin.create || noop
  const pUpdate = plugin.update || noop
  const pDelete = plugin.delete || noop

  return function compiledDriver (source, target, options) {
    if (source === null) {
      return pCreate(target, options)
    } else if (isDeleted(target)) {
      return pDelete(source, options)
    } else {
      return pUpdate(source, target, options)
    }
  }
}

function bindCommit<T, O> (commit: Commit<T, O>): Handler<T, O> {
  return (status, options) => execCommit(commit, status, options)
}

export function createHandler<T, O> (driver?: Driver<T, O>): Handler<T, O> {
  return driver
    ? bindCommit(compileDriver(driver))
    : status => Promise.resolve(commitStatus(status))
}
