import { isDeleted } from './deleted'
import { Status, commitStatus, updateStatus } from './status'

export type Commit<T, O = any> = (
  source: T | null,
  target: T | null,
  options?: O
) => Promise<T | void>

export interface Plugin<T, O = any> {
  create? (target: T, options?: O): Promise<T | void>
  update? (source: T, target: T, options?: O): Promise<T | void>
  delete? (source: T, options?: O): Promise<T | void>
}

export type Driver<T, O = any> = Commit<T, O> | Plugin<T, O>

export type Handler<T, O> = (status: Status<T>, options?: O) => Promise<Status<T>>

async function execCommit<T, O> (
  commit: Commit<T, O>,
  status: Status<T>,
  options?: O
): Promise<Status<T>> {
  const source = status.source
  const target = isDeleted(status.target) ? null : status.target
  if (source !== target) {
    const out = await commit(source, target, options)
    if (out !== undefined) {
      status = updateStatus(status, out)
    }
  }
  return commitStatus(status)
}

function noop (): Promise<void> {
  return Promise.resolve()
}

function reducePlugin<T, O> (plugin: Plugin<T, O>): Commit<T, O> {
  const pCreate = plugin.create || noop
  const pUpdate = plugin.update || noop
  const pDelete = plugin.delete || noop

  return function (source, target, options) {
    if (source !== null && target !== null) {
      return pUpdate(source, target, options)
    } else if (source !== null) {
      return pDelete(source, options)
    } else if (target !== null) {
      return pCreate(target, options)
    } else {
      return noop()
    }
  }
}

function bindCommit<T, O> (commit: Commit<T, O>): Handler<T, O> {
  return (status, options) => execCommit(commit, status, options)
}

export function createHandler<T, O> (driver?: Driver<T, O>): Handler<T, O> {
  if (typeof driver === 'function') {
    return bindCommit(driver)
  } else if (typeof driver === 'object') {
    return bindCommit(reducePlugin(driver))
  } else {
    return status => Promise.resolve(commitStatus(status))
  }
}
