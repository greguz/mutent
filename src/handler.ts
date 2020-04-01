import { isDeleted } from './deleted'
import { Status, commitStatus, updateStatus } from './status'

export type Commit<T, O = any> = (
  source: T | null,
  target: T,
  options?: O
) => Promise<T | void>

export interface Plugin<T, O = any> {
  create? (target: T, options?: O): Promise<T | void>
  update? (source: T, target: T, options?: O): Promise<T | void>
  delete? (source: T, options?: O): Promise<T | void>
}

export type Driver<T, O = any> = Commit<T, O> | Plugin<T, O>

export type Handler<T, O> = (status: Status<T>, options?: O) => Promise<Status<T>>

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
      status = updateStatus(status, out)
    }
  }
  return commitStatus(status)
}

function noop (): Promise<void> {
  return Promise.resolve()
}

function compilePlugin<T, O> (plugin: Plugin<T, O>): Commit<T, O> {
  const pCreate = plugin.create || noop
  const pUpdate = plugin.update || noop
  const pDelete = plugin.delete || noop

  return function compiledPlugin (source, target, options) {
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
  if (typeof driver === 'function') {
    return bindCommit(driver)
  } else if (typeof driver === 'object') {
    return bindCommit(compilePlugin(driver))
  } else {
    return status => Promise.resolve(commitStatus(status))
  }
}
