import { Status, commitStatus } from './status'

export type Commit<O = any> = (source: any, target: any, options?: O) => any

export interface Plugin<O = any> {
  create? (target: any, options?: O): any
  update? (source: any, target: any, options?: O): any
  delete? (source: any, options?: O): any
}

export type Driver<O = any> = Commit<O> | Plugin<O>

export type Handler<O> = <S, T>(status: Status<S, T>, options?: O) => Promise<Status<T, T>>

async function execCommit<S, T, O> (
  commit: Commit<O>,
  status: Status<S, T>,
  options?: O
): Promise<Status<T, T>> {
  const { source, target }: Status<any, any> = status
  if (source !== target) {
    await commit(source, target, options)
  }
  return commitStatus(status)
}

function bindCommit<O> (commit: Commit<O>): Handler<O> {
  return (status, options) => execCommit(commit, status, options)
}

function noop () {
  // nothing to do
}

function reducePlugin<O> (plugin: Plugin<O>): Commit<O> {
  const pCreate = plugin.create || noop
  const pUpdate = plugin.update || noop
  const pDelete = plugin.delete || noop

  return function (source, target, options) {
    if (source === null) {
      return pCreate(target, options)
    } else if (target === null) {
      return pDelete(source, options)
    } else {
      return pUpdate(source, target, options)
    }
  }
}

export function createHandler<O> (driver?: Driver<O>): Handler<O> {
  if (typeof driver === 'function') {
    return bindCommit(driver)
  } else if (typeof driver === 'object') {
    return bindCommit(reducePlugin(driver))
  } else {
    return status => Promise.resolve(commitStatus(status))
  }
}
